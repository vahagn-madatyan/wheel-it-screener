import { EXCLUDED_INDUSTRIES, EXCLUDED_TICKERS, TICKER_LISTS } from "./constants";

/**
 * Parse strike price from OCC option symbol.
 * Format: ROOT + YYMMDD + P/C + 8-digit strike (price × 1000)
 * Example: AAPL260320P00150000 → 150.000
 * Returns 0 for malformed symbols.
 */
export function parseStrikeFromSymbol(sym: string): number {
  const match = sym.match(/(\d{8})$/);
  if (match) return parseInt(match[1], 10) / 1000;
  return 0;
}

/**
 * Check if a stock should be excluded based on industry or ticker.
 * - Excluded tickers: case-insensitive match against EXCLUDED_TICKERS
 * - Excluded industries: case-insensitive partial match against EXCLUDED_INDUSTRIES
 * Returns false when both industry and symbol are falsy (matching vanilla behavior).
 */
export function isExcludedSector(
  industry: string | null | undefined,
  symbol: string | null | undefined,
): boolean {
  if (!industry && !symbol) return false;
  if (symbol && EXCLUDED_TICKERS.includes(symbol.toUpperCase())) return true;
  if (!industry) return false;
  const ind = industry.toLowerCase();
  return EXCLUDED_INDUSTRIES.some((ex) => ind.includes(ex.toLowerCase()));
}

/**
 * Build ticker list from filter state.
 * - Uses named universe from TICKER_LISTS (falls back to wheel_popular)
 * - Merges in custom tickers: uppercased, split on comma/semicolon/whitespace,
 *   deduped, length-capped at 10 chars per ticker
 */
export function getTickerList(filters: {
  tickerUniverse: string;
  customTickers: string;
}): string[] {
  let tickers: string[] = [];

  if (filters.tickerUniverse !== "custom") {
    tickers = [...(TICKER_LISTS[filters.tickerUniverse] || TICKER_LISTS.wheel_popular)];
  }

  // Add custom tickers
  if (filters.customTickers) {
    const custom = filters.customTickers
      .toUpperCase()
      .split(/[,;\s]+/)
      .map((t) => t.trim())
      .filter((t) => t.length > 0 && t.length <= 10);
    custom.forEach((t) => {
      if (!tickers.includes(t)) tickers.push(t);
    });
  }

  return tickers;
}
