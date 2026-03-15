import type { StockResult } from "@/types";

/** CSV column headers — 24 columns matching vanilla app exactly */
const CSV_HEADERS = [
  "Symbol",
  "Name",
  "Industry",
  "Price",
  "Market Cap ($B)",
  "Avg Volume (M)",
  "P/E",
  "Beta",
  "Div Yield %",
  "IV Rank",
  "Premium Yield %",
  "Buying Power",
  "200 SMA Status",
  "200 SMA %",
  "Earnings Days",
  "Earnings Date",
  "Analyst Buy%",
  "ROE",
  "Net Margin",
  "Wheel Score",
  "Premium Score",
  "Liquidity Score",
  "Stability Score",
  "Fundamentals Score",
];

/** Wrap a string value for CSV: always double-quotes, embedded quotes become "" */
function escapeCSV(value: string): string {
  return '"' + value.replace(/"/g, '""') + '"';
}

/** Convert a single StockResult to a CSV row array (24 cells). Matches vanilla formatting exactly. */
function resultToRow(s: StockResult): string[] {
  return [
    s.symbol,
    escapeCSV(s.name || ""),
    escapeCSV(s.industry || ""),
    s.price.toFixed(2),
    s.marketCap > 0 ? (s.marketCap / 1e9).toFixed(2) : "",
    s.avgVolume > 0 ? s.avgVolume.toFixed(1) : "",
    s.pe != null && s.pe > 0 ? s.pe.toFixed(1) : "",
    s.beta != null ? s.beta.toFixed(2) : "",
    s.dividendYield > 0 ? s.dividendYield.toFixed(2) : "0",
    s.ivRank != null ? String(s.ivRank) : "",
    s.premiumYield != null ? s.premiumYield.toFixed(1) : "",
    s.buyingPower != null ? s.buyingPower.toFixed(0) : "",
    s.sma200Status ?? "",
    s.sma200Pct != null ? String(s.sma200Pct) : "",
    s.earningsDays != null ? String(s.earningsDays) : "",
    s.earningsDate || "",
    s.analystBuyPct != null ? String(s.analystBuyPct) : "",
    s.roe != null ? s.roe.toFixed(1) : "",
    s.netMargin != null ? s.netMargin.toFixed(1) : "",
    s.wheelScore != null ? String(s.wheelScore) : "",
    s.premiumScore != null ? String(s.premiumScore) : "",
    s.liquidityScore != null ? String(s.liquidityScore) : "",
    s.stabilityScore != null ? String(s.stabilityScore) : "",
    s.fundamentalsScore != null ? String(s.fundamentalsScore) : "",
  ];
}

/**
 * Build CSV content string from results.
 * Exported separately for testability (Blob/download not available in Vitest).
 */
export function buildCSVContent(results: StockResult[]): string {
  const rows = results.map(resultToRow);
  return [CSV_HEADERS.join(","), ...rows.map((r) => r.join(","))].join("\n");
}

/**
 * Export results to a downloadable CSV file.
 * Uses Blob + createObjectURL + ephemeral anchor click pattern.
 */
export function exportCSV(results: StockResult[]): void {
  if (results.length === 0) return;

  const csv = buildCSVContent(results);
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);

  const now = new Date();
  const pad = (n: number) => n.toString().padStart(2, "0");
  const filename = `WheelScan_${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}.csv`;

  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
