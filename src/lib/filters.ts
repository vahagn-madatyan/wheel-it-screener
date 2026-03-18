import type { StockResult, FilterState } from '@/types';
import { isExcludedSector } from './utils';
import {
  computeWheelMetrics,
  computeWheelScore,
  type EarningsEntry,
} from './scoring';

/**
 * Early metric-based filters that can run using only quote + metrics data.
 * Used in scan.ts to discard stocks before expensive Profile/Recommendation calls.
 * Checks: price, market cap, volume, P/E, D/E, net margin, sales growth, ROE,
 * dividends, and SMA200.
 */
export function passesMetricFilters(
  stock: StockResult,
  filters: FilterState,
): boolean {
  // Price filter
  if (
    stock.price <= 0 ||
    stock.price < filters.minPrice ||
    stock.price > filters.maxPrice
  )
    return false;

  // Market cap filter
  if (stock.marketCap > 0) {
    const capB = stock.marketCap / 1e9;
    if (capB < filters.minMktCap || capB > filters.maxMktCap) return false;
  }

  // Volume filter (avgVolume is in millions)
  if (stock.avgVolume > 0 && stock.avgVolume < filters.minVolume) return false;

  // P/E filter
  if (stock.pe !== null && stock.pe > 0 && stock.pe > filters.maxPE)
    return false;

  // D/E filter
  if (
    filters.maxDebtEquity !== undefined &&
    stock.debtToEquity !== null &&
    stock.debtToEquity > filters.maxDebtEquity
  )
    return false;

  // Net Margin filter
  if (
    filters.minNetMargin !== undefined &&
    stock.netMargin !== null &&
    stock.netMargin < filters.minNetMargin
  )
    return false;

  // Sales Growth filter
  if (
    filters.minSalesGrowth !== undefined &&
    stock.revenueGrowth !== null &&
    stock.revenueGrowth < filters.minSalesGrowth
  )
    return false;

  // ROE filter
  if (
    filters.minROE !== undefined &&
    stock.roe !== null &&
    stock.roe < filters.minROE
  )
    return false;

  // Dividend filter
  if (filters.requireDividends && stock.dividendYield <= 0) return false;

  // 200 SMA filter
  if (
    filters.aboveSMA200 &&
    stock.twoHundredDayAvg > 0 &&
    stock.price < stock.twoHundredDayAvg
  )
    return false;

  return true;
}

/**
 * Apply the complete filter pipeline and return scored, sorted results.
 * Pure function — no mutation of input candidates.
 *
 * Replicates the vanilla app.js filter sequence exactly:
 *   marketCap → volume → PE → D/E → netMargin → salesGrowth → ROE →
 *   sector exclusion → computeWheelMetrics → buyingPower → dividends →
 *   SMA200 → earnings proximity → IV rank → computeWheelScore →
 *   sort by wheelScore descending.
 *
 * NaN-sentinel fields (maxDebtEquity, minNetMargin, minSalesGrowth, minROE)
 * use `undefined` guard instead of vanilla's `!isNaN()`.
 */
export function filterStocks(
  candidates: StockResult[],
  filters: FilterState,
  earningsMap?: Record<string, EarningsEntry>,
): StockResult[] {
  const enriched: StockResult[] = [];

  for (const stock of candidates) {
    // Market cap filter
    if (stock.marketCap > 0) {
      const capB = stock.marketCap / 1e9;
      if (capB < filters.minMktCap || capB > filters.maxMktCap) continue;
    }

    // Volume filter (avgVolume is in millions)
    if (stock.avgVolume > 0 && stock.avgVolume < filters.minVolume) continue;

    // P/E filter
    if (stock.pe !== null && stock.pe > 0 && stock.pe > filters.maxPE) continue;

    // D/E filter — undefined means "don't filter" (replaces vanilla !isNaN)
    if (
      filters.maxDebtEquity !== undefined &&
      stock.debtToEquity !== null &&
      stock.debtToEquity > filters.maxDebtEquity
    )
      continue;

    // Net Margin filter
    if (
      filters.minNetMargin !== undefined &&
      stock.netMargin !== null &&
      stock.netMargin < filters.minNetMargin
    )
      continue;

    // Sales Growth filter (revenueGrowth is quarterly YoY %)
    if (
      filters.minSalesGrowth !== undefined &&
      stock.revenueGrowth !== null &&
      stock.revenueGrowth < filters.minSalesGrowth
    )
      continue;

    // ROE filter
    if (
      filters.minROE !== undefined &&
      stock.roe !== null &&
      stock.roe < filters.minROE
    )
      continue;

    // Sector exclusion filter
    if (
      filters.excludeRiskySectors &&
      isExcludedSector(stock.industry, stock.symbol)
    )
      continue;

    // Compute wheel metrics (pure — returns new object)
    const earningsEntry = earningsMap?.[stock.symbol] ?? null;
    let enrichedStock = computeWheelMetrics(stock, filters, earningsEntry);

    // Buying power filter
    if ((enrichedStock.buyingPower ?? 0) > filters.maxBP) continue;

    // Dividend filter
    if (filters.requireDividends && enrichedStock.dividendYield <= 0) continue;

    // 200 SMA filter
    if (
      filters.aboveSMA200 &&
      enrichedStock.twoHundredDayAvg > 0 &&
      enrichedStock.price < enrichedStock.twoHundredDayAvg
    )
      continue;

    // Earnings proximity filter
    if (
      filters.excludeEarnings &&
      enrichedStock.earningsDays !== null &&
      enrichedStock.earningsDays !== undefined &&
      enrichedStock.earningsDays <= 14 &&
      enrichedStock.earningsDays >= 0
    )
      continue;

    // IV rank filter
    if (
      (enrichedStock.ivRank ?? 0) < filters.minIVRank ||
      (enrichedStock.ivRank ?? 0) > filters.maxIVRank
    )
      continue;

    // Minimum premium yield filter
    if (
      filters.minPremium > 0 &&
      (enrichedStock.premiumYield ?? 0) < filters.minPremium
    )
      continue;

    // Compute wheel score (pure — returns new object)
    enrichedStock = computeWheelScore(enrichedStock, filters);

    enriched.push(enrichedStock);
  }

  // Sort by wheel score descending
  enriched.sort((a, b) => (b.wheelScore ?? 0) - (a.wheelScore ?? 0));

  return enriched;
}
