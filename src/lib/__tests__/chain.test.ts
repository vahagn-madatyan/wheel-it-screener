import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  fetchChainAlpaca,
  fetchChainMassive,
  selectBestExpiry,
  detectChainProvider,
} from "@/lib/chain";
import { AlpacaService } from "@/services/alpaca";
import type {
  AlpacaOptionSnapshot,
  AlpacaOptionSnapshotsResponse,
  AlpacaOptionContract,
} from "@/services/alpaca";
import { MassiveService } from "@/services/massive";
import type { PolygonOptionSnapshotResult } from "@/services/massive";

// ---- Mocks ----

vi.mock("@/services/alpaca", () => {
  return {
    AlpacaService: vi.fn(),
  };
});

vi.mock("@/services/massive", () => {
  return {
    MassiveService: vi.fn(),
  };
});

function makeAlpacaService(overrides: Partial<AlpacaService> = {}) {
  return {
    getOptionSnapshots: vi.fn(),
    getOptionContracts: vi.fn(),
    getAllOptionContracts: vi.fn(),
    getOptionExpirations: vi.fn(),
    ...overrides,
  } as unknown as AlpacaService;
}

function makeMassiveService(overrides: Partial<MassiveService> = {}) {
  return {
    getOptionChainSnapshot: vi.fn(),
    getAllOptionChainSnapshots: vi.fn(),
    getOptionContracts: vi.fn(),
    getAllOptionContracts: vi.fn(),
    ...overrides,
  } as unknown as MassiveService;
}

// ---- Helper factories ----

function makeAlpacaSnapshot(
  overrides: Partial<AlpacaOptionSnapshot> = {},
): AlpacaOptionSnapshot {
  return {
    greeks: { delta: -0.25, gamma: 0.05, theta: -0.02, vega: 0.1, rho: -0.01 },
    impliedVolatility: 0.35,
    latestQuote: { bp: 2.5, ap: 2.7, bs: 10, as: 15, t: "2026-03-15T10:00:00Z" },
    latestTrade: { p: 2.6, s: 5, t: "2026-03-15T09:55:00Z" },
    ...overrides,
  };
}

function makeAlpacaContract(
  symbol: string,
  overrides: Partial<AlpacaOptionContract> = {},
): AlpacaOptionContract {
  return {
    id: "contract-1",
    symbol,
    name: "Test Contract",
    status: "active",
    tradable: true,
    expiration_date: "2026-04-17",
    root_symbol: "AAPL",
    underlying_symbol: "AAPL",
    underlying_asset_id: "asset-1",
    type: "put",
    style: "american",
    strike_price: "150",
    size: "100",
    open_interest: "500",
    open_interest_date: "2026-03-14",
    close_price: "2.55",
    close_price_date: "2026-03-14",
    ...overrides,
  };
}

function makePolygonSnapshot(
  overrides: Partial<PolygonOptionSnapshotResult> = {},
): PolygonOptionSnapshotResult {
  return {
    break_even_price: 147.5,
    day: {
      change: 0.1,
      change_percent: 4.0,
      close: 2.6,
      high: 2.8,
      last_updated: Date.now(),
      low: 2.4,
      open: 2.5,
      previous_close: 2.5,
      volume: 120,
      vwap: 2.6,
    },
    details: {
      contract_type: "put",
      exercise_style: "american",
      expiration_date: "2026-04-17",
      shares_per_contract: 100,
      strike_price: 150,
      ticker: "O:AAPL260417P00150000",
    },
    greeks: { delta: -0.30, gamma: 0.04, theta: -0.03, vega: 0.12 },
    implied_volatility: 0.40,
    last_quote: {
      ask: 2.8,
      ask_size: 20,
      bid: 2.5,
      bid_size: 15,
      last_updated: Date.now(),
      midpoint: 2.65,
      timeframe: "REAL-TIME",
    },
    last_trade: { price: 2.6, size: 10, sip_timestamp: Date.now() },
    open_interest: 800,
    underlying_asset: {
      change_to_break_even: -2.5,
      last_updated: Date.now(),
      price: 155,
      ticker: "AAPL",
    },
    ...overrides,
  };
}

// ---- Tests ----

describe("selectBestExpiry", () => {
  it("picks closest to targetDTE", () => {
    // Mock dates: 7 days, 30 days, 45 days from today
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const d7 = new Date(today.getTime() + 7 * 86400000)
      .toISOString()
      .slice(0, 10);
    const d30 = new Date(today.getTime() + 30 * 86400000)
      .toISOString()
      .slice(0, 10);
    const d45 = new Date(today.getTime() + 45 * 86400000)
      .toISOString()
      .slice(0, 10);

    expect(selectBestExpiry([d7, d30, d45], 30)).toBe(d30);
    expect(selectBestExpiry([d7, d30, d45], 7)).toBe(d7);
    expect(selectBestExpiry([d7, d30, d45], 40)).toBe(d45);
  });

  it("excludes expirations with DTE < 1", () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const yesterday = new Date(today.getTime() - 86400000)
      .toISOString()
      .slice(0, 10);
    const todayStr = today.toISOString().slice(0, 10);
    const d30 = new Date(today.getTime() + 30 * 86400000)
      .toISOString()
      .slice(0, 10);

    // Yesterday and today both have DTE < 1
    expect(selectBestExpiry([yesterday, todayStr, d30], 1)).toBe(d30);
  });

  it("returns null when no valid expirations", () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today.getTime() - 86400000)
      .toISOString()
      .slice(0, 10);

    expect(selectBestExpiry([yesterday], 30)).toBeNull();
    expect(selectBestExpiry([], 30)).toBeNull();
  });
});

describe("detectChainProvider", () => {
  it("returns alpaca when both Alpaca keys set", () => {
    expect(
      detectChainProvider({
        alpacaKeyId: "key",
        alpacaSecretKey: "secret",
        massiveKey: "",
      }),
    ).toBe("alpaca");
  });

  it("prefers alpaca when both providers have keys", () => {
    expect(
      detectChainProvider({
        alpacaKeyId: "key",
        alpacaSecretKey: "secret",
        massiveKey: "mkey",
      }),
    ).toBe("alpaca");
  });

  it("returns massive when only Massive key set", () => {
    expect(
      detectChainProvider({
        alpacaKeyId: "",
        alpacaSecretKey: "",
        massiveKey: "mkey",
      }),
    ).toBe("massive");
  });

  it("returns null when no keys set", () => {
    expect(
      detectChainProvider({
        alpacaKeyId: "",
        alpacaSecretKey: "",
        massiveKey: "",
      }),
    ).toBeNull();
  });

  it("returns null when only one Alpaca key set", () => {
    expect(
      detectChainProvider({
        alpacaKeyId: "key",
        alpacaSecretKey: "",
        massiveKey: "",
      }),
    ).toBeNull();
  });
});

describe("fetchChainAlpaca", () => {
  it("merges snapshots + contracts into correct PutOption fields", async () => {
    const contractSymbol = "AAPL260417P00150000";

    const service = makeAlpacaService({
      getOptionSnapshots: vi.fn().mockResolvedValue({
        snapshots: {
          [contractSymbol]: makeAlpacaSnapshot({
            greeks: {
              delta: -0.25,
              gamma: 0.05,
              theta: -0.02,
              vega: 0.1,
              rho: -0.01,
            },
            impliedVolatility: 0.35,
            latestQuote: {
              bp: 2.5,
              ap: 2.7,
              bs: 10,
              as: 15,
              t: "2026-03-15",
            },
            latestTrade: { p: 2.6, s: 5, t: "2026-03-15" },
          }),
          AAPL260417P00145000: makeAlpacaSnapshot({
            greeks: {
              delta: -0.18,
              gamma: 0.04,
              theta: -0.015,
              vega: 0.08,
              rho: -0.005,
            },
            impliedVolatility: 0.30,
            latestQuote: {
              bp: 1.2,
              ap: 1.4,
              bs: 20,
              as: 25,
              t: "2026-03-15",
            },
            latestTrade: { p: 1.3, s: 3, t: "2026-03-15" },
          }),
        },
        next_page_token: null,
      } as AlpacaOptionSnapshotsResponse),
      getAllOptionContracts: vi.fn().mockResolvedValue([
        makeAlpacaContract(contractSymbol, {
          open_interest: "500",
          close_price: "2.55",
        }),
      ]),
    });

    const puts = await fetchChainAlpaca(service, "AAPL", "2026-04-17", 155, 33);

    expect(puts).toHaveLength(2);

    // Sorted by strike: 145, 150
    const p145 = puts[0];
    expect(p145.strike).toBe(145);
    expect(p145.bid).toBe(1.2);
    expect(p145.ask).toBe(1.4);
    expect(p145.delta).toBe(-0.18);
    expect(p145.iv).toBe(0.30);
    expect(p145.oi).toBe(0); // No matching contract

    const p150 = puts[1];
    expect(p150.strike).toBe(150);
    expect(p150.bid).toBe(2.5);
    expect(p150.ask).toBe(2.7);
    expect(p150.spread).toBeCloseTo(0.2);
    expect(p150.delta).toBe(-0.25);
    expect(p150.iv).toBe(0.35);
    expect(p150.oi).toBe(500);
    expect(p150.last).toBe(2.6);
    expect(p150.itm).toBe(false); // 150 < 155
  });

  it("sets oi=0 when snapshot exists but no matching contract", async () => {
    const service = makeAlpacaService({
      getOptionSnapshots: vi.fn().mockResolvedValue({
        snapshots: {
          AAPL260417P00140000: makeAlpacaSnapshot(),
        },
        next_page_token: null,
      }),
      getAllOptionContracts: vi.fn().mockResolvedValue([
        // Different symbol — won't match
        makeAlpacaContract("AAPL260417P00150000"),
      ]),
    });

    const puts = await fetchChainAlpaca(service, "AAPL", "2026-04-17", 155, 33);

    expect(puts).toHaveLength(1);
    expect(puts[0].strike).toBe(140);
    expect(puts[0].oi).toBe(0);
  });

  it("continues when OI fetch fails", async () => {
    const service = makeAlpacaService({
      getOptionSnapshots: vi.fn().mockResolvedValue({
        snapshots: {
          AAPL260417P00150000: makeAlpacaSnapshot(),
        },
        next_page_token: null,
      }),
      getAllOptionContracts: vi
        .fn()
        .mockRejectedValue(new Error("OI fetch failed")),
    });

    const puts = await fetchChainAlpaca(service, "AAPL", "2026-04-17", 155, 33);
    expect(puts).toHaveLength(1);
    expect(puts[0].oi).toBe(0);
  });
});

describe("fetchChainMassive", () => {
  it("maps Polygon snapshot to PutOption correctly", async () => {
    const service = makeMassiveService({
      getAllOptionChainSnapshots: vi.fn().mockResolvedValue([
        makePolygonSnapshot({
          details: {
            contract_type: "put",
            exercise_style: "american",
            expiration_date: "2026-04-17",
            shares_per_contract: 100,
            strike_price: 150,
            ticker: "O:AAPL260417P00150000",
          },
          greeks: { delta: -0.30, gamma: 0.04, theta: -0.03, vega: 0.12 },
          implied_volatility: 0.40,
          last_quote: {
            ask: 2.8,
            ask_size: 20,
            bid: 2.5,
            bid_size: 15,
            last_updated: Date.now(),
            midpoint: 2.65,
            timeframe: "REAL-TIME",
          },
          day: {
            change: 0.1,
            change_percent: 4.0,
            close: 2.6,
            high: 2.8,
            last_updated: Date.now(),
            low: 2.4,
            open: 2.5,
            previous_close: 2.5,
            volume: 120,
            vwap: 2.6,
          },
          open_interest: 800,
          last_trade: { price: 2.6, size: 10, sip_timestamp: Date.now() },
        }),
      ] as PolygonOptionSnapshotResult[]),
    });

    const puts = await fetchChainMassive(
      service,
      "AAPL",
      "2026-04-17",
      155,
      33,
    );

    expect(puts).toHaveLength(1);
    const p = puts[0];
    expect(p.strike).toBe(150);
    expect(p.bid).toBe(2.5);
    expect(p.ask).toBe(2.8);
    expect(p.mid).toBe(2.65); // Uses Polygon midpoint
    expect(p.delta).toBe(-0.30);
    expect(p.iv).toBe(0.40);
    expect(p.volume).toBe(120);
    expect(p.oi).toBe(800);
    expect(p.last).toBe(2.6);
    expect(p.itm).toBe(false); // 150 < 155
    expect(p.dte).toBe(33);
  });
});

describe("fetchChainAlpaca error propagation", () => {
  it("surfaces fetch failure as Error", async () => {
    const service = makeAlpacaService({
      getOptionSnapshots: vi
        .fn()
        .mockRejectedValue(new Error("Network failure")),
    });

    await expect(
      fetchChainAlpaca(service, "AAPL", "2026-04-17", 155, 33),
    ).rejects.toThrow("Network failure");
  });
});
