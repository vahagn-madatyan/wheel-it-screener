import { FinnhubService } from "@/services/finnhub";
import { TokenBucketRateLimiter } from "@/services/rate-limiter";
import { ApiError } from "@/services/api-error";
import { filterStocks } from "@/lib/filters";
import type { StockResult, FilterState } from "@/types";
import type { EarningsEntry } from "@/lib/scoring";
import type {
  FinnhubQuote,
  FinnhubMetrics,
} from "@/services/finnhub";

// ---- Public types ----

export type ScanPhaseLabel =
  | "earnings"
  | "quotes"
  | "profiles"
  | "recommendations"
  | "filtering";

export interface ScanParams {
  tickers: string[];
  finnhubKey: string;
  filters: FilterState;
  signal: AbortSignal;
  onTick: (ticker: string) => void;
  onCandidateFound: () => void;
  onPhaseChange: (phase: ScanPhaseLabel) => void;
}

export interface ScanResult {
  allResults: StockResult[];
  filteredResults: StockResult[];
}

// ---- Helpers ----

function checkAborted(signal: AbortSignal): void {
  if (signal.aborted) {
    throw new DOMException("Scan aborted", "AbortError");
  }
}

function formatDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function buildStockResult(
  symbol: string,
  quote: FinnhubQuote,
  metrics: FinnhubMetrics,
): StockResult {
  const m = metrics.metric;
  return {
    symbol,
    name: symbol, // overwritten in profile phase
    price: quote.c,
    prevClose: quote.pc,
    dayChange: quote.dp,
    dayHigh: quote.h,
    dayLow: quote.l,
    marketCap: (m["marketCapitalization"] as number) ?? 0,
    pe: (m["peBasicExclExtraTTM"] as number) ?? null,
    forwardPE: (m["peTTM"] as number) ?? null,
    beta: (m["beta"] as number) ?? null,
    dividendYield: (m["dividendYieldIndicatedAnnual"] as number) ?? 0,
    avgVolume: (m["10DayAverageTradingVolume"] as number) ?? 0,
    avgVolume3M: (m["3MonthAverageTradingVolume"] as number) ?? 0,
    twoHundredDayAvg: (m["200DayMovingAverage"] as number) ?? 0,
    fiftyTwoWeekHigh: (m["52WeekHigh"] as number) ?? 0,
    fiftyTwoWeekLow: (m["52WeekLow"] as number) ?? 0,
    fiftyTwoWeekHighDate: String(m["52WeekHighDate"] ?? ""),
    fiftyTwoWeekLowDate: String(m["52WeekLowDate"] ?? ""),
    roe: (m["roeTTM"] as number) ?? null,
    revenueGrowth: (m["revenueGrowthQuarterlyYoy"] as number) ?? null,
    netMargin: (m["netProfitMarginTTM"] as number) ?? null,
    currentRatio: (m["currentRatioQuarterly"] as number) ?? null,
    debtToEquity: (m["totalDebt/totalEquityQuarterly"] as number) ?? null,
    source: "finnhub",
  };
}

// ---- Scan orchestrator ----

/**
 * Run a full Finnhub stock scan.
 *
 * Pure async function — no store imports. All side effects via callbacks.
 * Creates its own FinnhubService and TokenBucketRateLimiter internally.
 * Rate limiter is always disposed in the finally block.
 *
 * 5-phase pipeline:
 *   1. Earnings calendar (single call)
 *   2. Quote + metrics per ticker (early price filter)
 *   3. Profile enrichment for candidates
 *   4. Analyst recommendations for candidates
 *   5. Full filter pipeline → scored, sorted results
 */
export async function runScan({
  tickers,
  finnhubKey,
  filters,
  signal,
  onTick,
  onCandidateFound,
  onPhaseChange,
}: ScanParams): Promise<ScanResult> {
  const rateLimiter = new TokenBucketRateLimiter(28, 28, 1000);
  const service = new FinnhubService(finnhubKey, rateLimiter);

  try {
    // ── Phase 1: Earnings calendar ──
    onPhaseChange("earnings");
    let earningsMap: Record<string, EarningsEntry> = {};

    try {
      const today = new Date();
      const future = new Date(today);
      future.setDate(future.getDate() + 120);
      const cal = await service.getEarningsCalendar(
        formatDate(today),
        formatDate(future),
        signal,
      );

      const now = Date.now();
      for (const event of cal.earningsCalendar) {
        const daysAway = Math.ceil(
          (new Date(event.date).getTime() - now) / (1000 * 60 * 60 * 24),
        );
        if (daysAway < 0) continue;

        const existing = earningsMap[event.symbol];
        if (!existing || daysAway < existing.daysAway) {
          earningsMap[event.symbol] = { date: event.date, daysAway };
        }
      }
    } catch (err) {
      // Non-fatal — warn and continue with empty map
      console.warn(
        "[scan] Earnings calendar failed, continuing:",
        err instanceof Error ? err.message : err,
      );
    }

    checkAborted(signal);

    // ── Phase 2: Quotes + Metrics per ticker ──
    onPhaseChange("quotes");
    const candidates: StockResult[] = [];

    for (const ticker of tickers) {
      checkAborted(signal);

      try {
        const [quote, metrics] = await Promise.all([
          service.getQuote(ticker, signal),
          service.getMetrics(ticker, signal),
        ]);

        const stock = buildStockResult(ticker, quote, metrics);

        // Early price filter — skip expensive enrichment for out-of-range stocks
        if (
          stock.price > 0 &&
          stock.price >= filters.minPrice &&
          stock.price <= filters.maxPrice
        ) {
          candidates.push(stock);
          onCandidateFound();
        }
      } catch (err) {
        // Auth errors surface immediately as user-facing message
        if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
          throw new Error("Invalid Finnhub API key");
        }
        // Other per-ticker errors are non-fatal
        console.warn(
          `[scan] Quote/metrics failed for ${ticker}:`,
          err instanceof Error ? err.message : err,
        );
      }

      onTick(ticker);
    }

    checkAborted(signal);

    // ── Phase 3: Profile enrichment for candidates ──
    onPhaseChange("profiles");

    for (const stock of candidates) {
      checkAborted(signal);

      try {
        const profile = await service.getProfile(stock.symbol, signal);
        if (profile.name) stock.name = profile.name;
        if (profile.finnhubIndustry) stock.industry = profile.finnhubIndustry;
        if (profile.exchange) stock.exchange = profile.exchange;
        if (profile.marketCapitalization > 0) {
          stock.marketCap = profile.marketCapitalization;
        }
      } catch (err) {
        // Non-fatal per ticker
        console.warn(
          `[scan] Profile failed for ${stock.symbol}:`,
          err instanceof Error ? err.message : err,
        );
      }
    }

    checkAborted(signal);

    // ── Phase 4: Analyst recommendations for candidates ──
    onPhaseChange("recommendations");

    for (const stock of candidates) {
      checkAborted(signal);

      try {
        const recs = await service.getRecommendations(stock.symbol, signal);
        if (recs.length > 0) {
          const latest = recs[0];
          const buy = (latest.strongBuy ?? 0) + (latest.buy ?? 0);
          const hold = latest.hold ?? 0;
          const sell = (latest.strongSell ?? 0) + (latest.sell ?? 0);
          stock.analystBuy = buy;
          stock.analystHold = hold;
          stock.analystSell = sell;
          const total = buy + hold + sell;
          stock.analystBuyPct =
            total > 0 ? Math.round((buy / total) * 100) : null;
        }
      } catch (err) {
        // Non-fatal per ticker
        console.warn(
          `[scan] Recommendations failed for ${stock.symbol}:`,
          err instanceof Error ? err.message : err,
        );
      }
    }

    checkAborted(signal);

    // ── Phase 5: Full filter + scoring pipeline ──
    onPhaseChange("filtering");
    const filteredResults = filterStocks(candidates, filters, earningsMap);

    return { allResults: candidates, filteredResults };
  } finally {
    rateLimiter.dispose();
  }
}
