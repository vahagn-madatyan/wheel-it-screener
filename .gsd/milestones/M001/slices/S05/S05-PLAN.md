# S05: Results + Scan Flow

**Goal:** Run button triggers a full Finnhub scan, results populate a sortable table with score tooltips, KPI cards summarize the run, and CSV export works.
**Demo:** User enters Finnhub key → clicks Run Screener → progress bar advances ticker-by-ticker → KPI cards animate with summary stats → results table shows scored/sorted stocks → hovering score shows 4-component breakdown → clicking column headers re-sorts → Export CSV downloads a 24-column file.

## Must-Haves

- Scan orchestrator: 5-phase pipeline (earnings → quote+metrics → profile → recommendations → filter+score) using FinnhubService with rate limiter, AbortController for cancellation
- Progress bar showing current ticker and percentage during scan
- Cancel button stops scan mid-flight without error state
- Results table with 12 columns matching vanilla app (ticker, price, mkt cap, volume, P/E, IV rank, premium yield, buying power, 200 SMA, earnings, wheel score, chain button)
- Click-to-sort on all sortable columns via resultsStore.setSortKey
- Gradient score bars (red → yellow → emerald) in wheel score column
- Radix Tooltip on score showing 4-component numeric breakdown (premium, liquidity, stability, fundamentals) with weights and weighted total
- KPI cards: scanned count, qualified count, avg wheel score, avg premium yield — with animated count-up
- CSV export with 24 columns matching vanilla format, timestamped filename
- Empty state when no results or scan hasn't run
- Error state surfaced inline (not alert/toast) on API failures (401/403 on first call = clear key error message)

## Proof Level

- This slice proves: integration (real API orchestration through to UI rendering)
- Real runtime required: yes (Finnhub API key needed for full integration test)
- Human/UAT required: no (browser assertions sufficient for functional verification)

## Verification

- `npx tsc --noEmit` — zero errors
- `npx vitest run` — all tests pass including new `csv-export.test.ts`
- `src/lib/__tests__/csv-export.test.ts` — CSV utility: correct 24-column header, value formatting, special character escaping, empty results handling
- Browser: Run scan with Finnhub key → progress bar advances → results table populates → column sort works → score tooltip shows breakdown → CSV downloads

## Observability / Diagnostics

- Runtime signals: scanStore phase transitions (idle→running→complete/error), progress percentage, currentTicker updated per ticker
- Inspection surfaces: `useScanStore.getState()` in browser console shows phase/progress/error; `useResultsStore.getState()` shows allResults/filteredResults/sort config
- Failure visibility: scanStore.error contains error message; first API 401/403 surfaces as "Invalid API key" in error state
- Redaction constraints: API keys never logged; FinnhubService endpoint strings already exclude token param (Decision #21)

## Integration Closure

- Upstream surfaces consumed: `useFilterStore` (filter state snapshot), `useApiKeyStore` (Finnhub key), `useScanStore` (phase actions), `useResultsStore` (setResults/setSortKey), `FinnhubService` (5 API methods), `TokenBucketRateLimiter`, `filterStocks()`, `getTickerList()`, `formatNum/formatMktCap` formatters
- New wiring introduced: `useScanRunner` hook connects button click → mutation → stores → UI; `ResultsTable` row click handler stubbed for S06 chain drill-down; `TooltipProvider` added at app root
- What remains before milestone is truly usable end-to-end: S06 (chain modal on row click), S07 (animations/polish), S08 (cleanup/build)

## Tasks

- [x] **T01: Build scan orchestrator and progress UI** `est:45m`
  - Why: The core async pipeline that makes the app do its job — fetches data, coordinates stores, handles abort. Highest-risk piece; everything else depends on scan data existing.
  - Files: `src/hooks/use-scan-runner.ts`, `src/lib/scan.ts`, `src/components/main/ProgressBar.tsx`, `src/components/sidebar/ActionButtons.tsx`
  - Do: Extract `runScan()` as a pure async function in `src/lib/scan.ts` that takes `{ filters, finnhubKey, earningsMap, signal, onTick, onCandidateFound }` — no store coupling. 5-phase pipeline matching vanilla: (1) earnings calendar, (2) quote+metrics per ticker with early price filter, (3) profile enrichment for candidates, (4) analyst recommendations, (5) `filterStocks()` call. Create `useScanRunner` hook wrapping `runScan` in `useMutation` — snapshots filter state at call time, manages AbortController in ref, creates/disposes TokenBucketRateLimiter per run, drives scanStore actions via `onTick`/`onSuccess`/`onError` callbacks. Handle AbortError as intentional cancel (→ `resetScan()`), not failure. Build `ProgressBar` component reading scanStore (phase, progress, currentTicker). Update `ActionButtons` with onClick → `mutation.mutate()`, show Cancel button when running.
  - Verify: `npx tsc --noEmit` passes; dev server renders; clicking Run with no key shows disabled state; scan structure is correct (manual code review of pipeline phases)
  - Done when: Run button triggers scan mutation, progress bar updates during scan, cancel aborts cleanly, scan errors surface in UI

- [x] **T02: Build results table, KPI cards, and score tooltip** `est:45m`
  - Why: The primary data display — users read scan results here. Covers the dense presentation layer: 12-column sortable table, gradient score bars, 4-component score tooltip, KPI summary cards, and empty state.
  - Files: `src/components/main/ResultsTable.tsx`, `src/components/main/ScoreTooltip.tsx`, `src/components/main/KpiCards.tsx`, `src/components/main/EmptyState.tsx`, `src/components/ui/tooltip.tsx`, `src/App.tsx`, `src/main.tsx`
  - Do: Add Radix `TooltipProvider` (delayDuration=200, skipDelayDuration=100) to `main.tsx`. Build `tooltip.tsx` as data-slot Radix wrapper (consistent with existing ui pattern). Build `ResultsTable` with 12 columns matching vanilla — ticker+name, price, mkt cap, volume, P/E, IV rank, premium yield, buying power, 200 SMA badge, earnings badge, wheel score with gradient bar, chain "Puts" button. Sort via `resultsStore.setSortKey` on header click with sort direction indicator (lucide ChevronUp/Down). Derive sorted array via `useMemo` from filteredResults + sort config. Handle string vs numeric sort for symbol/name columns. Build `ScoreTooltip` as Radix Tooltip showing 4 sub-scores with weight percentages and weighted total — reads weights from `useFilterStore`. Build gradient score bar: emerald ≥70, yellow ≥45, red <45 — CSS width% proportional to score. Build `KpiCards` — 4 cards reading from scanStore (scannedCount) + resultsStore (filteredResults.length, avg score, avg premium). Animated count-up via `useEffect` + requestAnimationFrame. Build `EmptyState` for pre-scan and zero-results states. Wire all into `App.tsx` main area: KPI cards → progress bar → results table / empty state, conditional on scan phase.
  - Verify: `npx tsc --noEmit` passes; browser shows empty state before scan; after scan, table renders with correct columns, sort indicators toggle on click, score tooltip appears on hover with 4 rows + total, KPI cards show correct values
  - Done when: Results table renders sorted data with all 12 columns, score tooltip shows 4-component breakdown, KPI cards display scan stats, empty state shows when appropriate

- [x] **T03: CSV export and integration verification** `est:30m`
  - Why: Closes the slice with the export feature and proves the full scan flow works end-to-end — the first time real API data flows through the entire React app.
  - Files: `src/lib/csv-export.ts`, `src/lib/__tests__/csv-export.test.ts`, `src/components/main/ResultsTable.tsx`
  - Do: Build `exportCSV(results)` in `src/lib/csv-export.ts` — 24-column output matching vanilla exactly (Symbol, Name, Industry, Price, Market Cap, Avg Volume, P/E, Beta, Div Yield, IV Rank, Premium Yield, Buying Power, 200 SMA Status, 200 SMA %, Earnings Days, Earnings Date, Analyst Buy%, ROE, Net Margin, Wheel Score, Premium Score, Liquidity Score, Stability Score, Fundamentals Score). Handle CSV escaping: double-quote wrapping for strings with commas, `""` for embedded quotes. Timestamped filename `WheelScan_YYYYMMDD_HHMMSS.csv`. Write Vitest tests covering: correct header count (24), value formatting matches vanilla, special char escaping, empty array returns headers only. Wire Export CSV button into results table header area (disabled when no results). Run full integration test via dev server with real Finnhub API key: enter key → select preset → run scan → verify progress → verify results → sort columns → hover tooltip → export CSV.
  - Verify: `npx vitest run src/lib/__tests__/csv-export.test.ts` passes; `npx tsc --noEmit` passes; browser: Export button downloads CSV file with correct format
  - Done when: CSV export produces 24-column file matching vanilla format, all slice verification checks pass, full scan flow proven working in browser

## Files Likely Touched

- `src/lib/scan.ts` — scan orchestrator (pure async function)
- `src/hooks/use-scan-runner.ts` — useMutation wrapper + AbortController + store coordination
- `src/lib/csv-export.ts` — CSV export utility
- `src/lib/__tests__/csv-export.test.ts` — CSV export tests
- `src/components/main/ProgressBar.tsx` — scan progress bar
- `src/components/main/ResultsTable.tsx` — 12-column sortable results table
- `src/components/main/ScoreTooltip.tsx` — Radix Tooltip with 4-component score breakdown
- `src/components/main/KpiCards.tsx` — 4 KPI summary cards with animated count-up
- `src/components/main/EmptyState.tsx` — empty/pre-scan state
- `src/components/ui/tooltip.tsx` — Radix Tooltip data-slot wrapper
- `src/components/sidebar/ActionButtons.tsx` — wire onClick + cancel button
- `src/App.tsx` — compose main area components
- `src/main.tsx` — add TooltipProvider
