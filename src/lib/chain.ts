import { AlpacaService } from "@/services/alpaca";
import type {
  AlpacaOptionSnapshot,
} from "@/services/alpaca";
import { MassiveService } from "@/services/massive";
import type { PolygonOptionSnapshotResult } from "@/services/massive";
import { TokenBucketRateLimiter } from "@/services/rate-limiter";
import { scorePuts } from "@/lib/put-scoring";
import { parseStrikeFromSymbol } from "@/lib/utils";
import type { PutOption, ChainData } from "@/types";

// ---- Public types ----

export type ChainProvider = "alpaca" | "massive";

export interface ChainParams {
  symbol: string;
  currentPrice: number;
  targetDTE: number;
  targetDelta: number;
  signal?: AbortSignal;
  provider: ChainProvider;
  // Alpaca auth
  alpacaKeyId?: string;
  alpacaSecretKey?: string;
  // Massive auth
  massiveKey?: string;
  massiveRateLimiter?: TokenBucketRateLimiter;
}

// ---- Expiry logic ----

/**
 * Select the expiration date closest to targetDTE from available expirations.
 * Excludes expirations with DTE < 1 (already expired or expiring today).
 * Returns null if no valid expirations exist.
 */
export function selectBestExpiry(
  expirations: string[],
  targetDTE: number,
): string | null {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const valid = expirations
    .map((exp) => {
      const expDate = new Date(exp + "T00:00:00");
      const dte = Math.round(
        (expDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
      );
      return { exp, dte };
    })
    .filter((e) => e.dte >= 1);

  if (valid.length === 0) return null;

  valid.sort(
    (a, b) => Math.abs(a.dte - targetDTE) - Math.abs(b.dte - targetDTE),
  );
  return valid[0].exp;
}

/**
 * Compute DTE from an expiry date string (YYYY-MM-DD).
 */
function computeDTE(expiry: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expDate = new Date(expiry + "T00:00:00");
  return Math.max(
    1,
    Math.round((expDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)),
  );
}

// ---- Provider detection ----

/**
 * Detect which chain provider to use based on available API keys.
 * Alpaca is preferred when both are available.
 */
export function detectChainProvider(keys: {
  alpacaKeyId: string;
  alpacaSecretKey: string;
  massiveKey: string;
}): ChainProvider | null {
  if (keys.alpacaKeyId && keys.alpacaSecretKey) return "alpaca";
  if (keys.massiveKey) return "massive";
  return null;
}

// ---- Alpaca path ----

/**
 * Fetch option chain via Alpaca: snapshots for greeks/quotes + contracts for OI.
 * Merges on OCC symbol key. Pure function — no store imports.
 */
export async function fetchChainAlpaca(
  service: AlpacaService,
  symbol: string,
  expiry: string,
  currentPrice: number,
  dte: number,
  signal?: AbortSignal,
): Promise<PutOption[]> {
  // Step 1: Fetch snapshots (greeks + quotes) — paginated
  const snapshots: Record<string, AlpacaOptionSnapshot> = {};
  let pageToken: string | null = null;

  for (let pg = 0; pg < 10; pg++) {
    const params: Record<string, string> = {
      type: "put",
      expiration_date: expiry,
      feed: "indicative",
      limit: "1000",
    };
    if (pageToken) params.page_token = pageToken;

    const snapData = await service.getOptionSnapshots(symbol, params, signal);
    const batch = snapData.snapshots || {};
    Object.assign(snapshots, batch);

    pageToken = snapData.next_page_token;
    if (!pageToken) break;
  }

  // Step 2: Fetch contracts for OI data (supplementary — failure non-fatal)
  const oiMap: Record<string, { oi: number; closePrice: number }> = {};
  try {
    const contracts = await service.getAllOptionContracts(
      {
        underlying_symbols: symbol,
        type: "put",
        status: "active",
        expiration_date: expiry,
        limit: "10000",
      },
      signal,
    );
    for (const c of contracts) {
      oiMap[c.symbol] = {
        oi: parseInt(c.open_interest, 10) || 0,
        closePrice: parseFloat(c.close_price) || 0,
      };
    }
  } catch {
    // OI fetch is supplementary — continue without it
  }

  // Step 3: Merge on OCC symbol key
  const puts: PutOption[] = [];
  for (const [contractSymbol, snap] of Object.entries(snapshots)) {
    const greeks = snap.greeks || ({} as Partial<NonNullable<AlpacaOptionSnapshot['greeks']>>);
    const quote = snap.latestQuote || { bp: 0, ap: 0, bs: 0, as: 0, t: "" };
    const trade = snap.latestTrade || { p: 0, s: 0, t: "" };

    const strike = parseStrikeFromSymbol(contractSymbol);
    if (strike <= 0) continue;

    const bid = quote.bp || 0;
    const ask = quote.ap || 0;
    const mid = (bid + ask) / 2;
    const spread = ask - bid;
    const spreadPct = mid > 0 ? (spread / mid) * 100 : 999;
    const delta =
      greeks.delta !== undefined ? greeks.delta : null;
    const iv =
      snap.impliedVolatility !== undefined ? snap.impliedVolatility : null;
    const itm = currentPrice > 0 && strike >= currentPrice;
    const premYield =
      strike > 0 && mid > 0 ? (mid / strike) * (365 / dte) * 100 : 0;

    // Merge OI from contracts
    const oiInfo = oiMap[contractSymbol] || { oi: 0, closePrice: 0 };

    puts.push({
      strike,
      bid,
      ask,
      mid,
      spread,
      spreadPct,
      volume: 0, // Alpaca snapshots don't have per-contract volume in quotes
      oi: oiInfo.oi,
      delta,
      iv,
      last: trade.p || oiInfo.closePrice || 0,
      premYield,
      itm,
      dte,
      putScore: 0,
      rec: "",
    });
  }

  puts.sort((a, b) => a.strike - b.strike);
  return puts;
}

// ---- Massive (Polygon) path ----

/**
 * Fetch option chain via Massive.com (Polygon API): chain snapshots filtered to puts.
 * Pure function — no store imports.
 */
export async function fetchChainMassive(
  service: MassiveService,
  symbol: string,
  expiry: string,
  currentPrice: number,
  dte: number,
  signal?: AbortSignal,
): Promise<PutOption[]> {
  const results = await service.getAllOptionChainSnapshots(
    symbol,
    {
      "contract_type": "put",
      "expiration_date": expiry,
    },
    signal,
  );

  const puts: PutOption[] = results.map((snap: PolygonOptionSnapshotResult) => {
    const strike = snap.details.strike_price;
    const bid = snap.last_quote?.bid ?? 0;
    const ask = snap.last_quote?.ask ?? 0;
    const mid = snap.last_quote?.midpoint ?? (bid + ask) / 2;
    const spread = ask - bid;
    const spreadPct = mid > 0 ? (spread / mid) * 100 : 999;
    const delta = snap.greeks?.delta ?? null;
    const iv = snap.implied_volatility ?? null;
    const itm = currentPrice > 0 && strike >= currentPrice;
    const premYield =
      strike > 0 && mid > 0 ? (mid / strike) * (365 / dte) * 100 : 0;

    return {
      strike,
      bid,
      ask,
      mid,
      spread,
      spreadPct,
      volume: snap.day?.volume ?? 0,
      oi: snap.open_interest ?? 0,
      delta,
      iv,
      last: snap.last_trade?.price ?? 0,
      premYield,
      itm,
      dte,
      putScore: 0,
      rec: "",
    };
  });

  puts.sort((a, b) => a.strike - b.strike);
  return puts;
}

// ---- Top-level dispatcher ----

/**
 * Fetch option chain for a symbol, dispatching to the correct provider.
 * Returns scored ChainData ready for display.
 */
export async function fetchChain(params: ChainParams): Promise<ChainData> {
  const { symbol, currentPrice, targetDTE, targetDelta, signal, provider } =
    params;

  console.log(`[chain] fetching ${symbol} via ${provider}`);

  // Get expirations
  let expirations: string[];

  if (provider === "alpaca") {
    const service = new AlpacaService(
      params.alpacaKeyId!,
      params.alpacaSecretKey!,
    );
    expirations = await service.getOptionExpirations(symbol, signal);
  } else {
    // Massive: get expirations from contracts reference
    const service = new MassiveService(
      params.massiveKey!,
      params.massiveRateLimiter,
    );
    const contracts = await service.getAllOptionContracts(
      {
        underlying_ticker: symbol,
        contract_type: "put",
        expired: "false",
        limit: "1000",
      },
      signal,
    );
    expirations = [
      ...new Set(contracts.map((c) => c.expiration_date)),
    ].sort();
  }

  // Select best expiry
  const selectedExpiry = selectBestExpiry(expirations, targetDTE);
  if (!selectedExpiry) {
    throw new Error(`No valid expirations found for ${symbol}`);
  }

  const dte = computeDTE(selectedExpiry);

  // Fetch puts for selected expiry
  let puts: PutOption[];

  if (provider === "alpaca") {
    const service = new AlpacaService(
      params.alpacaKeyId!,
      params.alpacaSecretKey!,
    );
    puts = await fetchChainAlpaca(
      service,
      symbol,
      selectedExpiry,
      currentPrice,
      dte,
      signal,
    );
  } else {
    const service = new MassiveService(
      params.massiveKey!,
      params.massiveRateLimiter,
    );
    puts = await fetchChainMassive(
      service,
      symbol,
      selectedExpiry,
      currentPrice,
      dte,
      signal,
    );
  }

  // Score puts
  const scoredPuts = scorePuts(puts, targetDelta);

  console.log(
    `[chain] loaded ${scoredPuts.length} puts for ${symbol}/${selectedExpiry}`,
  );

  return {
    symbol,
    expirations,
    selectedExpiry,
    puts: scoredPuts,
  };
}
