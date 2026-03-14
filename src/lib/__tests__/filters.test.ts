import { describe, it, expect } from "vitest";
import { filterStocks } from "../filters";
import type { StockResult, FilterState } from "@/types";

/** Factory for a stock that passes all default filters */
function makeStock(overrides: Partial<StockResult> = {}): StockResult {
  return {
    symbol: "TEST",
    name: "Test Corp",
    price: 50,
    prevClose: 49.5,
    dayChange: 1.01,
    dayHigh: 51,
    dayLow: 49,
    marketCap: 5_000_000_000, // 5B
    pe: 18,
    forwardPE: 16,
    beta: 1.0,
    dividendYield: 2.0,
    avgVolume: 5,
    avgVolume3M: 4.5,
    twoHundredDayAvg: 48,
    fiftyTwoWeekHigh: 60,
    fiftyTwoWeekLow: 35,
    fiftyTwoWeekHighDate: "2025-01-15",
    fiftyTwoWeekLowDate: "2024-06-10",
    roe: 20,
    revenueGrowth: 10,
    netMargin: 18,
    currentRatio: 2.0,
    debtToEquity: 0.5,
    source: "test",
    ...overrides,
  };
}

/** Default filters that let most stocks pass */
function makeFilters(overrides: Partial<FilterState> = {}): FilterState {
  return {
    minPrice: 5,
    maxPrice: 200,
    minMktCap: 1,
    maxMktCap: 2000,
    minVolume: 0.5,
    maxPE: 60,
    maxDebtEquity: undefined,
    minNetMargin: undefined,
    minSalesGrowth: undefined,
    minROE: undefined,
    tickerUniverse: "wheel_popular",
    customTickers: "",
    minPremium: 8,
    maxBP: 20000,
    targetDTE: 30,
    targetDelta: 0.3,
    minIVRank: 0,
    maxIVRank: 100,
    requireDividends: false,
    aboveSMA200: false,
    excludeEarnings: false,
    requireWeeklies: false,
    excludeRiskySectors: false,
    weightPremium: 30,
    weightLiquidity: 20,
    weightStability: 25,
    weightFundamentals: 25,
    ...overrides,
  };
}

describe("filterStocks", () => {
  it("does not mutate input candidates", () => {
    const candidates = [makeStock()];
    const original = JSON.stringify(candidates);
    filterStocks(candidates, makeFilters());
    expect(JSON.stringify(candidates)).toBe(original);
  });

  it("returns enriched results with wheelScore for passing stocks", () => {
    const result = filterStocks([makeStock()], makeFilters());
    expect(result.length).toBe(1);
    expect(result[0].wheelScore).toBeDefined();
    expect(result[0].ivRank).toBeDefined();
    expect(result[0].premiumYield).toBeDefined();
    expect(result[0].buyingPower).toBeDefined();
  });

  // ---- Individual filter tests ----

  it("filters by market cap (capB = marketCap / 1e9)", () => {
    // 500M = 0.5B, minMktCap=1 => filtered out
    const stock = makeStock({ marketCap: 500_000_000 });
    const result = filterStocks([stock], makeFilters({ minMktCap: 1 }));
    expect(result.length).toBe(0);
  });

  it("filters by max market cap", () => {
    // 3000B, maxMktCap=2000 => filtered out
    const stock = makeStock({ marketCap: 3_000_000_000_000 });
    const result = filterStocks([stock], makeFilters({ maxMktCap: 2000 }));
    expect(result.length).toBe(0);
  });

  it("passes stocks with marketCap=0 (no data) — skip marketCap filter", () => {
    const stock = makeStock({ marketCap: 0 });
    const result = filterStocks([stock], makeFilters({ minMktCap: 1 }));
    expect(result.length).toBe(1);
  });

  it("filters by volume", () => {
    // avgVolume=0.3, minVolume=0.5 => filtered out
    const stock = makeStock({ avgVolume: 0.3 });
    const result = filterStocks([stock], makeFilters({ minVolume: 0.5 }));
    expect(result.length).toBe(0);
  });

  it("passes stocks with avgVolume=0 — skip volume filter", () => {
    const stock = makeStock({ avgVolume: 0 });
    const result = filterStocks([stock], makeFilters({ minVolume: 5 }));
    expect(result.length).toBe(1);
  });

  it("filters by PE", () => {
    // pe=70, maxPE=60 => filtered out
    const stock = makeStock({ pe: 70 });
    const result = filterStocks([stock], makeFilters({ maxPE: 60 }));
    expect(result.length).toBe(0);
  });

  it("passes stocks with null PE — skip PE filter", () => {
    const stock = makeStock({ pe: null });
    const result = filterStocks([stock], makeFilters({ maxPE: 20 }));
    expect(result.length).toBe(1);
  });

  it("passes stocks with PE=0 — skip PE filter (vanilla: pe > 0 guard)", () => {
    const stock = makeStock({ pe: 0 });
    const result = filterStocks([stock], makeFilters({ maxPE: 20 }));
    expect(result.length).toBe(1);
  });

  it("filters by D/E when maxDebtEquity is defined", () => {
    const stock = makeStock({ debtToEquity: 2.0 });
    const result = filterStocks([stock], makeFilters({ maxDebtEquity: 1.0 }));
    expect(result.length).toBe(0);
  });

  it("skips D/E filter when maxDebtEquity is undefined", () => {
    const stock = makeStock({ debtToEquity: 5.0 });
    const result = filterStocks(
      [stock],
      makeFilters({ maxDebtEquity: undefined }),
    );
    expect(result.length).toBe(1);
  });

  it("filters by net margin when minNetMargin is defined", () => {
    const stock = makeStock({ netMargin: -5 });
    const result = filterStocks(
      [stock],
      makeFilters({ minNetMargin: 0 }),
    );
    expect(result.length).toBe(0);
  });

  it("skips net margin filter when undefined", () => {
    const stock = makeStock({ netMargin: -100 });
    const result = filterStocks(
      [stock],
      makeFilters({ minNetMargin: undefined }),
    );
    expect(result.length).toBe(1);
  });

  it("filters by sales growth", () => {
    const stock = makeStock({ revenueGrowth: -10 });
    const result = filterStocks(
      [stock],
      makeFilters({ minSalesGrowth: 5 }),
    );
    expect(result.length).toBe(0);
  });

  it("filters by ROE", () => {
    const stock = makeStock({ roe: 5 });
    const result = filterStocks([stock], makeFilters({ minROE: 10 }));
    expect(result.length).toBe(0);
  });

  it("filters excluded sectors", () => {
    const stock = makeStock({ industry: "Biotechnology" });
    const result = filterStocks(
      [stock],
      makeFilters({ excludeRiskySectors: true }),
    );
    expect(result.length).toBe(0);
  });

  it("filters excluded tickers", () => {
    const stock = makeStock({ symbol: "GME" });
    const result = filterStocks(
      [stock],
      makeFilters({ excludeRiskySectors: true }),
    );
    expect(result.length).toBe(0);
  });

  it("does not exclude risky sectors when flag is off", () => {
    const stock = makeStock({ industry: "Biotechnology" });
    const result = filterStocks(
      [stock],
      makeFilters({ excludeRiskySectors: false }),
    );
    expect(result.length).toBe(1);
  });

  it("filters by buying power (computed after metrics)", () => {
    // price=150 => buyingPower=15000, maxBP=10000 => filtered
    const stock = makeStock({ price: 150 });
    const result = filterStocks([stock], makeFilters({ maxBP: 10000 }));
    expect(result.length).toBe(0);
  });

  it("filters by dividend requirement", () => {
    const stock = makeStock({ dividendYield: 0 });
    const result = filterStocks(
      [stock],
      makeFilters({ requireDividends: true }),
    );
    expect(result.length).toBe(0);
  });

  it("filters by SMA200", () => {
    // price=45, sma200=48 => below => filtered when aboveSMA200=true
    const stock = makeStock({ price: 45, twoHundredDayAvg: 48 });
    const result = filterStocks(
      [stock],
      makeFilters({ aboveSMA200: true }),
    );
    expect(result.length).toBe(0);
  });

  it("skips SMA200 filter when twoHundredDayAvg is 0", () => {
    const stock = makeStock({ price: 45, twoHundredDayAvg: 0 });
    const result = filterStocks(
      [stock],
      makeFilters({ aboveSMA200: true }),
    );
    expect(result.length).toBe(1);
  });

  it("filters by earnings proximity", () => {
    const stock = makeStock();
    const earningsMap = { TEST: { date: "2025-04-01", daysAway: 7 } };
    const result = filterStocks(
      [stock],
      makeFilters({ excludeEarnings: true }),
      earningsMap,
    );
    expect(result.length).toBe(0);
  });

  it("passes earnings >14 days away", () => {
    const stock = makeStock();
    const earningsMap = { TEST: { date: "2025-05-01", daysAway: 30 } };
    const result = filterStocks(
      [stock],
      makeFilters({ excludeEarnings: true }),
      earningsMap,
    );
    expect(result.length).toBe(1);
  });

  it("passes when no earnings data (earningsDays is null)", () => {
    const stock = makeStock();
    const result = filterStocks(
      [stock],
      makeFilters({ excludeEarnings: true }),
    );
    expect(result.length).toBe(1);
  });

  it("filters by IV rank range", () => {
    // Stock's ivRank will be computed; adjust range to exclude it
    // Default stock gets ivRank=46
    const result = filterStocks(
      [makeStock()],
      makeFilters({ minIVRank: 50, maxIVRank: 100 }),
    );
    expect(result.length).toBe(0);
  });

  it("passes stock within IV rank range", () => {
    const result = filterStocks(
      [makeStock()],
      makeFilters({ minIVRank: 40, maxIVRank: 50 }),
    );
    expect(result.length).toBe(1);
  });

  // ---- Ordering and composition tests ----

  it("computes metrics before buying power filter (filter ordering)", () => {
    // This verifies that computeWheelMetrics runs before the buyingPower check.
    // price=90 => buyingPower = 9000, maxBP=10000 => passes
    // price=110 => buyingPower = 11000, maxBP=10000 => fails
    const stocks = [
      makeStock({ symbol: "PASS", price: 90 }),
      makeStock({ symbol: "FAIL", price: 110 }),
    ];
    const result = filterStocks(stocks, makeFilters({ maxBP: 10000 }));
    expect(result.length).toBe(1);
    expect(result[0].symbol).toBe("PASS");
    expect(result[0].buyingPower).toBe(9000);
  });

  it("sorts results by wheelScore descending", () => {
    // Two stocks that pass filters — higher premiumYield => higher wheelScore
    const stocks = [
      makeStock({ symbol: "LOW", beta: 0.3, price: 37 }),   // lower ivRank area
      makeStock({ symbol: "HIGH", beta: 2.5, price: 37 }),  // higher ivRank
    ];
    const result = filterStocks(stocks, makeFilters());
    expect(result.length).toBe(2);
    expect(result[0].wheelScore!).toBeGreaterThanOrEqual(result[1].wheelScore!);
  });

  it("injects earnings data from earningsMap", () => {
    const stock = makeStock({ symbol: "AAPL" });
    const earningsMap = { AAPL: { date: "2025-04-25", daysAway: 45 } };
    const result = filterStocks([stock], makeFilters(), earningsMap);
    expect(result[0].earningsDays).toBe(45);
    expect(result[0].earningsDate).toBe("2025-04-25");
  });

  it("handles empty candidates array", () => {
    const result = filterStocks([], makeFilters());
    expect(result).toEqual([]);
  });

  it("handles all candidates filtered out", () => {
    // All stocks have pe=70, maxPE=60
    const stocks = [
      makeStock({ pe: 70 }),
      makeStock({ pe: 80 }),
    ];
    const result = filterStocks(stocks, makeFilters({ maxPE: 60 }));
    expect(result).toEqual([]);
  });
});
