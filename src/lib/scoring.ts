import type { StockResult, FilterState, WeightConfig } from "@/types";

/** Earnings calendar entry for a single symbol */
export interface EarningsEntry {
  date: string;
  daysAway: number;
}

/**
 * Compute wheel metrics for a stock.
 * Pure function — returns a new StockResult with buyingPower, earningsDays,
 * ivRank, premiumYield, sma200Status, sma200Pct computed.
 *
 * Replicates vanilla app.js computeWheelMetrics exactly.
 */
export function computeWheelMetrics(
  stock: StockResult,
  filters: Pick<FilterState, "targetDelta" | "targetDTE">,
  earningsEntry?: EarningsEntry | null,
): StockResult {
  const result = { ...stock };

  // Buying power = strike × 100 (approximate as price × 100)
  result.buyingPower = result.price * 100;

  // Earnings days from calendar
  result.earningsDays = earningsEntry ? earningsEntry.daysAway : null;
  result.earningsDate = earningsEntry ? earningsEntry.date : null;

  // Estimate IV Rank from 52-week range and beta
  const h = result.fiftyTwoWeekHigh;
  const l = result.fiftyTwoWeekLow;
  if (h > 0 && l > 0 && h > l) {
    const rangePercent = ((h - l) / h) * 100;
    const pricePosition = (result.price - l) / (h - l);
    // If price is near lows, IV is likely elevated (fear)
    const positionFactor = Math.max(0, (1 - pricePosition)) * 40;
    const betaFactor = result.beta
      ? Math.min(Math.max(result.beta, 0.3), 3) * 20
      : 25;
    const rangeFactor = Math.min(rangePercent * 0.8, 50);
    result.ivRank = Math.min(
      100,
      Math.max(0, Math.round(positionFactor + betaFactor + rangeFactor * 0.3)),
    );
  } else {
    result.ivRank = 30; // default
  }

  // Estimate annualized premium yield
  const ivFactor = result.ivRank / 100;
  const deltaFactor = filters.targetDelta / 0.3;
  const monthlyYield = ivFactor * 2.5 * deltaFactor; // % per month
  result.premiumYield =
    Math.round(monthlyYield * (365 / filters.targetDTE) * 10) / 10;
  result.premiumYield = Math.max(0, Math.min(100, result.premiumYield));

  // 200 SMA status
  if (result.twoHundredDayAvg > 0) {
    result.sma200Status =
      result.price >= result.twoHundredDayAvg ? "above" : "below";
    result.sma200Pct =
      Math.round(
        ((result.price - result.twoHundredDayAvg) / result.twoHundredDayAvg) *
          1000,
      ) / 10;
  } else {
    result.sma200Status = "n/a";
    result.sma200Pct = null;
  }

  return result;
}

/**
 * Compute wheel score for a stock.
 * Pure function — returns a new StockResult with premiumScore, liquidityScore,
 * stabilityScore, fundamentalsScore, and wheelScore computed.
 *
 * Replicates vanilla app.js computeWheelScore exactly.
 * Uses UNROUNDED sub-scores for wheelScore calculation (matching vanilla).
 */
export function computeWheelScore(
  stock: StockResult,
  weights: WeightConfig,
): StockResult {
  const result = { ...stock };
  const totalWeight =
    weights.weightPremium +
    weights.weightLiquidity +
    weights.weightStability +
    weights.weightFundamentals;

  // Premium score (0-100)
  const premiumScore = Math.min(100, ((result.premiumYield ?? 0) / 35) * 100);

  // Liquidity score (0-100) — avgVolume in millions
  const vol = result.avgVolume || result.avgVolume3M || 0;
  const liquidityScore = Math.min(100, (vol / 20) * 100);

  // Stability score (0-100)
  let stabilityScore = 50;
  if (result.beta !== null) {
    // Ideal beta for wheel: 0.5-1.3
    if (result.beta >= 0.5 && result.beta <= 1.3) {
      stabilityScore = 85;
    } else if (result.beta < 0.5) {
      stabilityScore = 70; // low vol, less premium
    } else {
      stabilityScore = Math.max(10, 85 - (result.beta - 1.3) * 35);
    }
  }
  // Factor in 52-week range position
  if (result.fiftyTwoWeekHigh > 0 && result.fiftyTwoWeekLow > 0) {
    const pos =
      (result.price - result.fiftyTwoWeekLow) /
      (result.fiftyTwoWeekHigh - result.fiftyTwoWeekLow);
    // Sweet spot: 30-80% of range (not at extremes)
    if (pos >= 0.3 && pos <= 0.8) {
      stabilityScore = stabilityScore * 0.6 + 80 * 0.4;
    } else if (pos < 0.3) {
      stabilityScore = stabilityScore * 0.6 + 40 * 0.4; // near 52w low = risky
    } else {
      stabilityScore = stabilityScore * 0.6 + 55 * 0.4; // near high = less buffer
    }
  }

  // Fundamentals score (0-100)
  let fundScore = 50;
  if (result.pe !== null && result.pe > 0) {
    fundScore =
      result.pe < 12
        ? 95
        : result.pe < 20
          ? 80
          : result.pe < 30
            ? 60
            : result.pe < 45
              ? 40
              : 20;
  }
  if (result.dividendYield > 0)
    fundScore += Math.min(15, result.dividendYield * 3);
  if (result.roe && result.roe > 15) fundScore += 8;
  if (result.analystBuyPct != null && result.analystBuyPct > 60)
    fundScore += 7;
  if (result.netMargin && result.netMargin > 15) fundScore += 5;
  fundScore = Math.min(100, Math.round(fundScore));

  result.premiumScore = Math.round(premiumScore);
  result.liquidityScore = Math.round(liquidityScore);
  result.stabilityScore = Math.round(stabilityScore);
  result.fundamentalsScore = fundScore;

  // wheelScore uses UNROUNDED sub-scores (matching vanilla)
  result.wheelScore = Math.round(
    (premiumScore * weights.weightPremium +
      liquidityScore * weights.weightLiquidity +
      stabilityScore * weights.weightStability +
      fundScore * weights.weightFundamentals) /
      totalWeight,
  );

  return result;
}
