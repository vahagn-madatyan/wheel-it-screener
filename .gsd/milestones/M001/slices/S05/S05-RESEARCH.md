# S05: Results + Scan Flow — Research

**Date:** 2026-03-15

## Summary

S05 is the "make it actually do something" slice — wiring the Run button to a full scan orchestration, displaying results in a sortable table with score tooltips, showing progress, computing KPIs, and exporting CSV. All the hard building blocks exist: `FinnhubService` with rate-limited retry (S02), `filterStocks` / `computeWheelScore` / `computeWheelMetrics` as tested pure functions (S01), `scanStore` with phase state machine, `resultsStore` with sort toggling, and `filterStore` fully wired to sidebar controls (S04).

The main complexity is the scan orchestrator — a 5-phase sequential pipeline (earnings calendar → quote+metrics per ticker → profile enrichment → analyst recommendations → filter+score) that must coordinate `FinnhubService`, both stores, and an `AbortController` for cancellation. The vanilla `runScreener()` does this in ~230 lines of imperative DOM-mutation code; the React version replaces DOM side effects with store actions and wraps the pipeline in `useMutation` per Decision #2.

Secondary complexity is the results table: 12 visible columns with click-to-sort, gradient score bars, and a Radix Tooltip/Popover breakdown showing 4 weighted sub-scores. The table itself is straightforward but dense — lots of conditional formatting (badges, colors, null handling).

## Recommendation

Build in 3 tasks:

1. **T01 — Scan orchestrator + progress UI:** Extract `runScan()` as an async function, wrap in `useMutation` custom hook (`useScanRunner`), wire ActionButtons onClick, build ProgressBar component, handle AbortController lifecycle. This is the highest-risk piece.

2. **T02 — Results table + KPI cards + score tooltip:** Build `ResultsTable` with 12 columns, click-to-sort via `resultsStore.setSortKey`, gradient score bars, `ScoreTooltip` via Radix Tooltip (hover-triggered, 4-row breakdown), KPI cards with count-up animation, empty state.

3. **T03 — CSV export + integration verification:** Build `exportCSV()` utility (24-column output matching vanilla), wire export button, run full integration test with dev server to verify end-to-end scan flow.

## Don't Hand-Roll

| Problem | Existing Solution | Why Use It |
|---------|------------------|------------|
| Score tooltip positioning | `@radix-ui/react-tooltip` (via `radix-ui` meta-package) | Auto-positions, collision-aware, accessible, hover-triggered by default. Already in node_modules. |
| Async operation lifecycle | `useMutation` from `@tanstack/react-query` v5 | Prevents double-invocation, provides isPending/error state, already wired as QueryClientProvider in main.tsx. Decision #2. |
| Rate-limited API calls | `TokenBucketRateLimiter` from `src/services/rate-limiter.ts` | Pairs with FinnhubService constructor. 28 tokens/sec capacity. Must call `dispose()` on cleanup. |
| Icons (sort arrows, export, etc.) | `lucide-react` ^0.577.0 | Already a dependency. ChevronUp, ChevronDown, Download, ArrowUpDown available. |

## Existing Code and Patterns

- `src/services/finnhub.ts` — All 5 API methods needed for scan: `getQuote`, `getMetrics`, `getProfile`, `getRecommendations`, `getEarningsCalendar`. All accept `AbortSignal`. Retries 429 with multiplicative backoff (Decision #22).
- `src/lib/filters.ts` → `filterStocks()` — Full filter pipeline + scoring in one pure function. Takes candidates + filters + earningsMap, returns sorted scored results. This replaces steps 5 of the vanilla flow entirely.
- `src/lib/scoring.ts` → `computeWheelMetrics()`, `computeWheelScore()` — Pure functions called inside `filterStocks`. Score sub-components stored as `premiumScore`, `liquidityScore`, `stabilityScore`, `fundamentalsScore` on each `StockResult`.
- `src/lib/utils.ts` → `getTickerList()` — Builds ticker array from filter state (universe + custom tickers). Direct reuse.
- `src/stores/scan-store.ts` — Phase state machine (`idle|running|complete|error`), `startScan(totalCount)`, `tickProgress(ticker)`, `incrementCandidates()`, `completeScan()`, `failScan(error)`, `resetScan()`, `setEarningsMap(map)`. All scan lifecycle actions ready.
- `src/stores/results-store.ts` — `setResults(all, filtered)`, `setSortKey(key)` with asc/desc toggle, `clearResults()`. Sort config tracked as `{ key, direction }`.
- `src/components/sidebar/ActionButtons.tsx` — Run button exists, disabled logic works (phase + finnhub key check). Needs `onClick` handler wired to scan mutation.
- `src/components/ui/*.tsx` — `data-slot` pattern established for Radix wrappers. Follow same pattern for Tooltip.
- `src/components/layout/DashboardLayout.tsx` — Main area `{children}` slot. App.tsx currently renders placeholder; S05 replaces with KPI cards + results table + progress bar.
- `src/lib/formatters.ts` — `formatNum()`, `formatMktCap()`, `escapeHtml()`, `truncate()` — all tested, direct reuse in table cells.

## Constraints

- **Finnhub rate limit: ~30 calls/sec on free tier.** Vanilla uses 2 parallel calls per ticker (quote + metrics), then 1 per candidate (profile), then 1 per candidate (recommendations). For 50 tickers producing 30 candidates: ~100 + 30 + 30 = 160 API calls. At 28 tokens/sec rate limiter: ~6 seconds minimum.
- **AbortSignal is per-service-call, not built into useMutation.** Must manage `AbortController` in a React ref. Pass `signal` to each FinnhubService method. On abort, catch AbortError and transition scanStore to idle (not error).
- **TokenBucketRateLimiter uses setInterval internally.** Must call `dispose()` when scan completes or aborts to prevent leaked intervals. Create new instance per scan, dispose in finally block.
- **resultsStore.setSortKey sorts client-side** by toggling direction on repeated clicks. The sort happens in the component (compute sorted array from `filteredResults` + `sort` config). Store doesn't re-sort automatically — component derives sorted order.
- **Radix Tooltip requires `TooltipProvider` wrapper** at app root (or above the table). Controls `delayDuration` and `skipDelayDuration` for hover behavior. Must be added to main.tsx or App.tsx.
- **CSV uses 24 columns, table uses 12.** CSV includes industry, beta, div yield, forward PE, analyst %, ROE, net margin, and all 4 sub-scores that aren't shown in the table. Keep these as separate concerns.
- **4 weight categories, not 6.** R018 says "6-component" but the actual implementation has 4 user-facing categories (Premium, Liquidity, Stability, Fundamentals) per S01/S04 findings and the WeightConfig type. Tooltip shows 4 rows + weighted total.

## Common Pitfalls

- **Stale closure in scan loop** — The scan orchestrator runs a long async loop. If it reads store state via hook closures (e.g. `filters` from `useFilterStore()`), values could be stale if user changes filters mid-scan. Solution: snapshot filter state once at scan start and pass as argument to `runScan()`, not as a closure.
- **Double-scan on StrictMode** — React 19 StrictMode double-invokes effects. `useMutation` is immune (triggered by user click), but if scan kickoff were in an effect it would fire twice. Keep scan as button-click → `mutation.mutate()` only.
- **AbortError vs real errors** — When user cancels, `fetch` throws `DOMException` with name `AbortError`. Must catch this specifically and treat as intentional cancel (→ `resetScan()`), not as a failure (→ `failScan()`).
- **Rate limiter not disposed on cancel** — If scan is aborted mid-flight, the `finally` block must call `rateLimiter.dispose()`. If the rate limiter is shared across scans, stale intervals accumulate.
- **Table re-sort on every render** — `filteredResults` array + sort config should produce a sorted view via `useMemo`, not a sort-in-place on the array. In-place sort would trigger unnecessary re-renders.
- **Tooltip flicker on dense table rows** — Radix Tooltip's default 700ms delay is too slow for data inspection. Set `delayDuration={200}` and `skipDelayDuration={100}` on the Provider. But too fast (0ms) causes flicker when moving between rows.
- **CSV special characters** — Stock names and industries can contain commas and quotes. Must escape with double-quotes wrapping and `""` for embedded quotes (vanilla already does this — replicate pattern).

## Open Risks

- **Finnhub API key validity not verified before scan.** Currently status badges show "Set"/"Not Set" based on key presence, not actual API validation. A scan with an invalid key will fail on the first API call. Mitigate: catch 401/403 on first call and surface clear error message. Could add key validation ping in future.
- **Large ticker lists (50+ tickers) will feel slow** even with rate limiter. The vanilla app takes 15-30 seconds for a full scan. Progress UI must be highly responsive (update every ticker, not every 5th) to feel alive.
- **Enrichment phases (profile + recommendations) make 2× more API calls** than strictly needed for scoring. Profile is for name/industry — nice to have. Recommendations are for analystBuyPct used in fundamentals scoring. Skipping either changes the score output vs vanilla parity. Keep both for now.
- **`filteredResults` sort in resultsStore lacks string sort handling.** The vanilla `sortByCol` lowercases strings before comparing. `setSortKey` in resultsStore uses a simple numeric comparison pattern. Need to handle `symbol` and `name` columns as string sorts.

## Skills Discovered

| Technology | Skill | Status |
|------------|-------|--------|
| TanStack Query | jezweb/claude-skills@tanstack-query (2.5K installs) | available — not installing; useMutation usage is straightforward |
| Frontend UI | frontend-design (bundled) | installed — load for table/KPI component design |
| Radix UI | — | none found — using existing codebase patterns (data-slot wrapper) |

## Sources

- Vanilla scan flow extracted from `app.js` lines 305–550 (runScreener function)
- Vanilla CSV export from `app.js` lines 842–890 (exportCSV function)
- Vanilla table rendering from `app.js` lines 685–780 (renderResults + updateKPIs)
- Vanilla table columns from `index.vanilla.html` lines 337–350 (12 columns: Ticker, Price, Mkt Cap, Vol, P/E, IV Rank, Prem Yield, BP Req, 200 SMA, Earnings, Score, Chain)
- KPI card structure from `index.vanilla.html` lines 312–334 (4 cards: Scanned, Passed, Avg Score, Avg Premium)
- Score tooltip spec from `STRATEGY_FILTERS.md` lines 1–40 (4-component × weight breakdown)
- Radix Tooltip API from `node_modules/@radix-ui/react-tooltip/dist/index.d.ts` (Provider + Root + Trigger + Content)
