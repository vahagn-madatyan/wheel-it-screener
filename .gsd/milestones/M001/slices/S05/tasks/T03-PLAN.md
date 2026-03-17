---
estimated_steps: 4
estimated_files: 4
---

# T03: CSV export and integration verification

**Slice:** S05 — Results + Scan Flow
**Milestone:** M001

## Description

Build the CSV export utility with 24 columns matching the vanilla app exactly, write Vitest tests for it, wire the export button, and run the full end-to-end integration test with a real Finnhub API key to prove the entire scan flow works.

## Steps

1. **Create `src/lib/csv-export.ts`** — `exportCSV(results: StockResult[])` function. 24-column header matching vanilla exactly: Symbol, Name, Industry, Price, Market Cap ($B), Avg Volume (M), P/E, Beta, Div Yield %, IV Rank, Premium Yield %, Buying Power, 200 SMA Status, 200 SMA %, Earnings Days, Earnings Date, Analyst Buy%, ROE, Net Margin, Wheel Score, Premium Score, Liquidity Score, Stability Score, Fundamentals Score. Value formatting matches vanilla: `toFixed` for numbers, empty string for null, double-quote wrapping for strings with commas, `""` for embedded quotes. Timestamped filename: `WheelScan_YYYYMMDD_HHMMSS.csv`. Uses Blob + createObjectURL + ephemeral anchor click pattern (same as vanilla).

2. **Write `src/lib/__tests__/csv-export.test.ts`** — Test cases:
   - Correct 24-column header row
   - Numeric formatting matches vanilla (price 2dp, mktCap in $B 2dp, volume 1dp, PE 1dp, etc.)
   - String escaping: name with commas gets double-quoted, embedded quotes become `""`
   - Null/missing fields produce empty strings (not "null" or "undefined")
   - Empty results array produces header row only
   - Separate `buildCSVContent` export for testability (Blob/download not testable in Vitest)

3. **Wire export button in `ResultsTable.tsx`** — Add Export CSV button in the table header area (above the table, next to results count). Disabled when `filteredResults.length === 0`. onClick calls `exportCSV(filteredResults)`. Use lucide Download icon.

4. **Full integration verification** — Start dev server, enter Finnhub API key, run scan, verify: progress bar advances, KPI cards update, results table populates, column sort works, score tooltip shows breakdown, CSV downloads. Check for JS console errors. This is the first time real API data flows through the entire React app.

## Must-Haves

- [ ] 24-column CSV header matches vanilla exactly
- [ ] CSV value formatting matches vanilla (numeric precision, null handling, string escaping)
- [ ] Vitest tests pass for CSV generation
- [ ] Export button disabled when no results, enabled after scan
- [ ] Full scan flow verified end-to-end with real Finnhub API

## Verification

- `npx vitest run src/lib/__tests__/csv-export.test.ts` — all tests pass
- `npx tsc --noEmit` — zero errors
- `npx vitest run` — all tests pass (existing + new)
- Browser: Export CSV button downloads file with correct 24-column format
- Browser: Full scan flow works end-to-end (key → preset → scan → progress → results → sort → tooltip → export)

## Inputs

- `src/types/index.ts` — StockResult interface (24 exportable fields)
- `src/components/main/ResultsTable.tsx` — table component from T02 (add export button)
- T01 + T02 outputs: complete scan flow + results display
- Vanilla `app.js` exportCSV function (lines 843-890) — reference for exact column order and formatting

## Expected Output

- `src/lib/csv-export.ts` — CSV export utility with `exportCSV()` and `buildCSVContent()` functions
- `src/lib/__tests__/csv-export.test.ts` — Vitest tests for CSV generation
- `src/components/main/ResultsTable.tsx` — Updated with Export CSV button
