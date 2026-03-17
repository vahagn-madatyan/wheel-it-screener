import { describe, it, expect } from 'vitest';
import { computeWheelMetrics, computeWheelScore } from '../scoring';
import type { StockResult, WeightConfig } from '@/types';

/** Factory for a minimal StockResult with sensible defaults */
function makeStock(overrides: Partial<StockResult> = {}): StockResult {
  return {
    symbol: 'TEST',
    name: 'Test Corp',
    price: 50,
    prevClose: 49.5,
    dayChange: 1.01,
    dayHigh: 51,
    dayLow: 49,
    marketCap: 5_000_000_000,
    pe: 18,
    forwardPE: 16,
    beta: 1.0,
    dividendYield: 2.0,
    avgVolume: 5,
    avgVolume3M: 4.5,
    twoHundredDayAvg: 48,
    fiftyTwoWeekHigh: 60,
    fiftyTwoWeekLow: 35,
    fiftyTwoWeekHighDate: '2025-01-15',
    fiftyTwoWeekLowDate: '2024-06-10',
    roe: 20,
    revenueGrowth: 10,
    netMargin: 18,
    currentRatio: 2.0,
    debtToEquity: 0.5,
    source: 'test',
    ...overrides,
  };
}

const defaultFilters = { targetDelta: 0.3, targetDTE: 30 };
const defaultWeights: WeightConfig = {
  weightPremium: 30,
  weightLiquidity: 20,
  weightStability: 25,
  weightFundamentals: 25,
};

// ---- computeWheelMetrics ----

describe('computeWheelMetrics', () => {
  it('does not mutate the input stock', () => {
    const stock = makeStock();
    const original = { ...stock };
    computeWheelMetrics(stock, defaultFilters);
    expect(stock).toEqual(original);
  });

  it('computes buyingPower as price × 100', () => {
    const result = computeWheelMetrics(
      makeStock({ price: 42.5 }),
      defaultFilters,
    );
    expect(result.buyingPower).toBe(4250);
  });

  it('sets earnings from entry', () => {
    const result = computeWheelMetrics(makeStock(), defaultFilters, {
      date: '2025-04-15',
      daysAway: 30,
    });
    expect(result.earningsDays).toBe(30);
    expect(result.earningsDate).toBe('2025-04-15');
  });

  it('sets earningsDays to null when no entry provided', () => {
    const result = computeWheelMetrics(makeStock(), defaultFilters);
    expect(result.earningsDays).toBeNull();
    expect(result.earningsDate).toBeNull();
  });

  it('computes exact ivRank for mid-range price position with beta 1.0', () => {
    // price=50, low=35, high=60 => pricePosition=(50-35)/(60-35)=0.6
    // positionFactor = max(0, (1-0.6))*40 = 16
    // betaFactor = min(max(1.0, 0.3), 3)*20 = 20
    // rangeFactor = min(((60-35)/60)*100*0.8, 50) = min(33.33, 50) = 33.33
    // ivRank = min(100, max(0, round(16 + 20 + 33.33*0.3))) = round(46) = 46
    const result = computeWheelMetrics(makeStock(), defaultFilters);
    expect(result.ivRank).toBe(46);
  });

  it('computes exact ivRank for near-52w-low price position', () => {
    // price=37, low=35, high=60 => pricePosition=(37-35)/(60-35)=0.08
    // positionFactor = max(0, (1-0.08))*40 = 36.8
    // betaFactor = 20 (beta=1.0)
    // rangeFactor = 33.33 (same range)
    // ivRank = round(36.8 + 20 + 33.33*0.3) = round(66.8) = 67
    const result = computeWheelMetrics(
      makeStock({ price: 37 }),
      defaultFilters,
    );
    expect(result.ivRank).toBe(67);
  });

  it('computes exact ivRank for near-52w-high price position', () => {
    // price=59, low=35, high=60 => pricePosition=(59-35)/(60-35)=0.96
    // positionFactor = max(0, (1-0.96))*40 = 1.6
    // betaFactor = 20
    // rangeFactor = 33.33
    // ivRank = round(1.6 + 20 + 33.33*0.3) = round(31.6) = 32
    const result = computeWheelMetrics(
      makeStock({ price: 59 }),
      defaultFilters,
    );
    expect(result.ivRank).toBe(32);
  });

  it('uses default betaFactor of 25 when beta is null', () => {
    // price=50, low=35, high=60 => positionFactor=16
    // betaFactor = 25 (null beta)
    // rangeFactor = 33.33
    // ivRank = round(16 + 25 + 33.33*0.3) = round(51) = 51
    const result = computeWheelMetrics(
      makeStock({ beta: null }),
      defaultFilters,
    );
    expect(result.ivRank).toBe(51);
  });

  it('clamps beta to [0.3, 3] range for betaFactor', () => {
    // beta=0.1 => clamped to 0.3 => betaFactor = 0.3*20 = 6
    // positionFactor = 16, rangeFactor*0.3 = 10
    // ivRank = round(16 + 6 + 10) = 32
    const result = computeWheelMetrics(
      makeStock({ beta: 0.1 }),
      defaultFilters,
    );
    expect(result.ivRank).toBe(32);

    // beta=5.0 => clamped to 3 => betaFactor = 3*20 = 60
    // ivRank = round(16 + 60 + 10) = 86
    const result2 = computeWheelMetrics(
      makeStock({ beta: 5.0 }),
      defaultFilters,
    );
    expect(result2.ivRank).toBe(86);
  });

  it('defaults ivRank to 30 when high/low are zero', () => {
    const result = computeWheelMetrics(
      makeStock({ fiftyTwoWeekHigh: 0, fiftyTwoWeekLow: 0 }),
      defaultFilters,
    );
    expect(result.ivRank).toBe(30);
  });

  it('defaults ivRank to 30 when high equals low', () => {
    const result = computeWheelMetrics(
      makeStock({ fiftyTwoWeekHigh: 50, fiftyTwoWeekLow: 50 }),
      defaultFilters,
    );
    expect(result.ivRank).toBe(30);
  });

  it('computes exact premiumYield for known ivRank', () => {
    // ivRank=46, targetDelta=0.30, targetDTE=30
    // ivFactor = 46/100 = 0.46
    // deltaFactor = 0.30/0.30 = 1.0
    // monthlyYield = 0.46 * 2.5 * 1.0 = 1.15
    // premiumYield = round(1.15 * (365/30) * 10) / 10 = round(139.99) / 10 = 14.0
    const result = computeWheelMetrics(makeStock(), defaultFilters);
    expect(result.premiumYield).toBe(14);
  });

  it('computes premiumYield with different delta and DTE', () => {
    // ivRank=46 (same stock), targetDelta=0.20, targetDTE=45
    // deltaFactor = 0.20/0.30 = 0.6667
    // monthlyYield = 0.46 * 2.5 * 0.6667 = 0.7667
    // premiumYield = round(0.7667 * (365/45) * 10) / 10 = round(62.16) / 10 = 6.2
    const result = computeWheelMetrics(makeStock(), {
      targetDelta: 0.2,
      targetDTE: 45,
    });
    expect(result.premiumYield).toBe(6.2);
  });

  it('clamps premiumYield to 0-100', () => {
    // Very high ivRank + short DTE + wide delta => could exceed 100
    const result = computeWheelMetrics(makeStock({ price: 37, beta: 5.0 }), {
      targetDelta: 0.5,
      targetDTE: 7,
    });
    expect(result.premiumYield).toBeLessThanOrEqual(100);
    expect(result.premiumYield).toBeGreaterThanOrEqual(0);
  });

  it('computes sma200Status above', () => {
    // price=50, twoHundredDayAvg=48 => above
    const result = computeWheelMetrics(makeStock(), defaultFilters);
    expect(result.sma200Status).toBe('above');
    // sma200Pct = round(((50-48)/48)*1000)/10 = round(41.67)/10 = 4.2
    expect(result.sma200Pct).toBe(4.2);
  });

  it('computes sma200Status below', () => {
    const result = computeWheelMetrics(
      makeStock({ price: 45, twoHundredDayAvg: 48 }),
      defaultFilters,
    );
    expect(result.sma200Status).toBe('below');
    // sma200Pct = round(((45-48)/48)*1000)/10 = round(-62.5)/10
    // JS Math.round(-62.5) = -62 (rounds toward +∞)
    expect(result.sma200Pct).toBe(-6.2);
  });

  it('computes sma200Status n/a when no SMA', () => {
    const result = computeWheelMetrics(
      makeStock({ twoHundredDayAvg: 0 }),
      defaultFilters,
    );
    expect(result.sma200Status).toBe('n/a');
    expect(result.sma200Pct).toBeNull();
  });
});

// ---- computeWheelScore ----

describe('computeWheelScore', () => {
  it('does not mutate the input stock', () => {
    const stock = makeStock({ premiumYield: 14, ivRank: 46 });
    const original = { ...stock };
    computeWheelScore(stock, defaultWeights);
    expect(stock).toEqual(original);
  });

  it('computes exact sub-scores and wheelScore for a known stock', () => {
    // premiumYield=14 => premiumScore = min(100, (14/35)*100) = 40
    // avgVolume=5 => liquidityScore = min(100, (5/20)*100) = 25
    // beta=1.0 (in 0.5-1.3) => stabilityScore base = 85
    //   price=50, low=35, high=60 => pos=(50-35)/(60-35)=0.6 (in 0.3-0.8)
    //   stabilityScore = 85*0.6 + 80*0.4 = 51 + 32 = 83
    // pe=18 (in 12-20 range) => fundScore base = 80
    //   dividendYield=2.0 => + min(15, 2*3) = +6 => 86
    //   roe=20 (>15) => +8 => 94
    //   analystBuyPct not set => +0
    //   netMargin=18 (>15) => +5 => 99
    //   fundScore = min(100, round(99)) = 99
    // wheelScore = round((40*30 + 25*20 + 83*25 + 99*25) / 100)
    //            = round((1200 + 500 + 2075 + 2475) / 100) = round(6250/100) = round(62.5) = 63
    const stock = makeStock({ premiumYield: 14, ivRank: 46 });
    const result = computeWheelScore(stock, defaultWeights);
    expect(result.premiumScore).toBe(40);
    expect(result.liquidityScore).toBe(25);
    expect(result.stabilityScore).toBe(83);
    expect(result.fundamentalsScore).toBe(99);
    expect(result.wheelScore).toBe(63);
  });

  it('computes stabilityScore for low beta (<0.5)', () => {
    // beta=0.3 => stabilityScore base = 70
    // pos=0.6 => sweet spot => 70*0.6 + 80*0.4 = 42+32 = 74
    const stock = makeStock({ beta: 0.3, premiumYield: 10 });
    const result = computeWheelScore(stock, defaultWeights);
    expect(result.stabilityScore).toBe(74);
  });

  it('computes stabilityScore for high beta (>1.3)', () => {
    // beta=2.0 => stabilityScore base = max(10, 85 - (2.0-1.3)*35) = max(10, 85-24.5) = 60.5
    // pos=0.6 => 60.5*0.6 + 80*0.4 = 36.3+32 = 68.3 => round = 68
    const stock = makeStock({ beta: 2.0, premiumYield: 10 });
    const result = computeWheelScore(stock, defaultWeights);
    expect(result.stabilityScore).toBe(68);
  });

  it('computes stabilityScore for null beta with near-low position', () => {
    // null beta => stabilityScore base = 50
    // price=37, low=35, high=60 => pos=(37-35)/(60-35)=0.08 (<0.3)
    // stabilityScore = 50*0.6 + 40*0.4 = 30+16 = 46
    const stock = makeStock({
      beta: null,
      price: 37,
      premiumYield: 10,
    });
    const result = computeWheelScore(stock, defaultWeights);
    expect(result.stabilityScore).toBe(46);
  });

  it('computes stabilityScore for near-high position (>0.8)', () => {
    // beta=1.0 => base = 85
    // price=59, low=35, high=60 => pos=0.96 (>0.8)
    // stabilityScore = 85*0.6 + 55*0.4 = 51+22 = 73
    const stock = makeStock({ price: 59, premiumYield: 10 });
    const result = computeWheelScore(stock, defaultWeights);
    expect(result.stabilityScore).toBe(73);
  });

  it('computes fundamentalsScore PE tiers correctly', () => {
    // PE < 12 => 95 + bonuses
    const r1 = computeWheelScore(
      makeStock({
        pe: 8,
        dividendYield: 0,
        roe: null,
        netMargin: null,
        premiumYield: 10,
      }),
      defaultWeights,
    );
    expect(r1.fundamentalsScore).toBe(95);

    // PE in [20, 30) => 60 base
    const r2 = computeWheelScore(
      makeStock({
        pe: 25,
        dividendYield: 0,
        roe: null,
        netMargin: null,
        premiumYield: 10,
      }),
      defaultWeights,
    );
    expect(r2.fundamentalsScore).toBe(60);

    // PE >= 45 => 20 base
    const r3 = computeWheelScore(
      makeStock({
        pe: 50,
        dividendYield: 0,
        roe: null,
        netMargin: null,
        premiumYield: 10,
      }),
      defaultWeights,
    );
    expect(r3.fundamentalsScore).toBe(20);
  });

  it('adds fundamentals bonuses correctly', () => {
    // pe=null => fundScore base = 50
    // dividendYield=5 => +min(15, 5*3)=+15 => 65
    // roe=20 => +8 => 73
    // analystBuyPct=70 => +7 => 80
    // netMargin=20 => +5 => 85
    const stock = makeStock({
      pe: null,
      dividendYield: 5,
      roe: 20,
      analystBuyPct: 70,
      netMargin: 20,
      premiumYield: 10,
    });
    const result = computeWheelScore(stock, defaultWeights);
    expect(result.fundamentalsScore).toBe(85);
  });

  it('caps fundamentalsScore at 100', () => {
    // pe=8 => 95, dividendYield=5 => +15=110, roe=20 => +8, etc
    // capped at 100
    const stock = makeStock({
      pe: 8,
      dividendYield: 5,
      roe: 20,
      analystBuyPct: 70,
      netMargin: 20,
      premiumYield: 10,
    });
    const result = computeWheelScore(stock, defaultWeights);
    expect(result.fundamentalsScore).toBe(100);
  });

  it('falls back to avgVolume3M when avgVolume is 0', () => {
    const stock = makeStock({
      avgVolume: 0,
      avgVolume3M: 10,
      premiumYield: 14,
    });
    const result = computeWheelScore(stock, defaultWeights);
    // 10/20*100 = 50
    expect(result.liquidityScore).toBe(50);
  });

  it('handles zero volume gracefully', () => {
    const stock = makeStock({
      avgVolume: 0,
      avgVolume3M: 0,
      premiumYield: 14,
    });
    const result = computeWheelScore(stock, defaultWeights);
    expect(result.liquidityScore).toBe(0);
  });

  it('uses custom weight distribution', () => {
    const stock = makeStock({ premiumYield: 14 });
    const premWeights: WeightConfig = {
      weightPremium: 100,
      weightLiquidity: 0,
      weightStability: 0,
      weightFundamentals: 0,
    };
    const result = computeWheelScore(stock, premWeights);
    // wheelScore should equal premiumScore since only premium has weight
    expect(result.wheelScore).toBe(result.premiumScore);
  });

  it('returns wheelScore 0 when all weights are zero', () => {
    const stock = makeStock({ premiumYield: 20, avgVolume: 5 });
    const enriched = computeWheelMetrics(stock, defaultFilters, null);
    const zeroWeights: WeightConfig = {
      weightPremium: 0,
      weightLiquidity: 0,
      weightStability: 0,
      weightFundamentals: 0,
    };
    const result = computeWheelScore(enriched, zeroWeights);
    expect(result.wheelScore).toBe(0);
    expect(Number.isNaN(result.wheelScore)).toBe(false);
  });
});
