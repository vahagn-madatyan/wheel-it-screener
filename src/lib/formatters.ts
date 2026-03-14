/**
 * Format a number with locale grouping and fixed decimal places.
 * Returns "—" for null, undefined, or NaN inputs (matching vanilla formatNum).
 */
export function formatNum(n: number | null | undefined, decimals: number): string {
  if (n === null || n === undefined || isNaN(n)) return "—";
  return n.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/**
 * Format market cap as human-readable string with T/B/M suffix.
 * Returns "—" for zero, negative, or falsy values (matching vanilla formatMktCap).
 */
export function formatMktCap(cap: number | null | undefined): string {
  if (!cap || cap <= 0) return "—";
  if (cap >= 1e12) return "$" + (cap / 1e12).toFixed(1) + "T";
  if (cap >= 1e9) return "$" + (cap / 1e9).toFixed(1) + "B";
  if (cap >= 1e6) return "$" + (cap / 1e6).toFixed(0) + "M";
  return "$" + cap.toLocaleString();
}

/**
 * Escape HTML special characters using string-based replace chain.
 * Replaces & < > " ' (matching the 5 characters the vanilla DOM-based escapeHtml covers).
 */
export function escapeHtml(str: string | null | undefined): string {
  if (!str) return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Truncate a string to `len` characters, appending "..." if over limit.
 * Returns "" for falsy input (matching vanilla truncate).
 */
export function truncate(str: string | null | undefined, len: number): string {
  if (!str) return "";
  return str.length > len ? str.slice(0, len) + "..." : str;
}
