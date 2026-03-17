---
estimated_steps: 5
estimated_files: 7
---

# T02: Build results table, KPI cards, and score tooltip

**Slice:** S05 — Results + Scan Flow
**Milestone:** M001

## Description

Build the primary data display layer — the 12-column sortable results table with gradient score bars, Radix Tooltip showing 4-component score breakdown, KPI summary cards with animated count-up, and empty state. This is dense presentational code but low-risk since all data shapes are established.

## Steps

1. **Create `src/components/ui/tooltip.tsx`** — Radix Tooltip wrapper using the data-slot pattern (matching existing switch.tsx/slider.tsx). Export `Tooltip`, `TooltipTrigger`, `TooltipContent`. Add `TooltipProvider` with `delayDuration={200}` and `skipDelayDuration={100}` to `src/main.tsx` (wrap around App, inside QueryClientProvider).

2. **Build `src/components/main/ScoreTooltip.tsx`** — Receives `stock: StockResult` prop. Renders Radix Tooltip wrapping the score bar trigger. Content shows 4 rows (Premium, Liquidity, Stability, Fundamentals) each with weight percentage from `useFilterStore` and sub-score value. Horizontal divider, then "Weighted Total" row with `wheelScore/100`. Sub-score values colored: ≥70 emerald, ≥45 yellow, <45 red (matching bar colors).

3. **Build `src/components/main/ResultsTable.tsx`** — 12 columns matching vanilla:
   - Ticker (symbol + truncated name), Price, Mkt Cap, Volume, P/E, IV Rank, Premium Yield, Buying Power, 200 SMA (badge: pass/fail/warn), Earnings (badge with days-away coloring), Wheel Score (gradient bar + ScoreTooltip), Chain ("Puts" button — onClick stubbed for S06).
   - Header cells clickable for sortable columns. `setSortKey` on click. Sort direction indicator (ChevronUp/ChevronDown from lucide-react, ArrowUpDown for unsorted).
   - Derive sorted array via `useMemo` from `filteredResults` + `sort` config. Handle string sort for `symbol`/`name` (lowercase compare), numeric sort for everything else. Null/undefined values sort last.
   - Gradient score bar: CSS `width: ${score}%` with background emerald (≥70), yellow (≥45), red (<45). Score value text overlaid.
   - SMA badge: green "Above" / red "Below" / yellow "N/A" with percentage in title.
   - Earnings badge: red ≤14d, yellow ≤30d, green >30d, yellow "N/A" for null.

4. **Build `src/components/main/KpiCards.tsx`** — 4 cards in a responsive grid. Values: Tickers Scanned (`scanStore.scannedCount`), Qualified (`filteredResults.length`), Avg Score (computed from filteredResults), Avg Premium (computed from filteredResults). Animated count-up: `useEffect` watching value changes, `requestAnimationFrame` loop interpolating from 0 to target over ~600ms. Show "—" before scan runs.

5. **Build `src/components/main/EmptyState.tsx` and compose in `App.tsx`** — EmptyState shows when phase is idle (pre-scan message) or complete with zero results (adjust filters message). In `App.tsx`, replace the current placeholder with: `<KpiCards />` top, `<ProgressBar />` below KPIs, then either `<ResultsTable />` (when results exist) or `<EmptyState />`. Conditional rendering based on scan phase and results count.

## Must-Haves

- [ ] 12 table columns matching vanilla app exactly
- [ ] Click-to-sort with direction toggle and visual indicator on all sortable columns
- [ ] Sorted array derived via useMemo (not in-place sort)
- [ ] Gradient score bars with correct color thresholds (emerald ≥70, yellow ≥45, red <45)
- [ ] Radix Tooltip showing 4-component score breakdown with weights and weighted total
- [ ] KPI cards showing scanned count, qualified count, avg score, avg premium
- [ ] Animated count-up on KPI values
- [ ] Empty state for pre-scan and zero-results scenarios
- [ ] TooltipProvider added to main.tsx with correct delay settings

## Verification

- `npx tsc --noEmit` — zero errors
- Browser: empty state visible before scan
- Browser: after scan data exists, table renders all 12 columns
- Browser: clicking column header toggles sort direction, visual indicator updates
- Browser: hovering score shows tooltip with 4 rows + total
- Browser: KPI cards display correct computed values
- Browser: gradient bars colored correctly per score threshold

## Inputs

- `src/stores/results-store.ts` — filteredResults, sort config, setSortKey
- `src/stores/scan-store.ts` — scannedCount, phase
- `src/stores/filter-store.ts` — weight values for tooltip
- `src/lib/formatters.ts` — formatNum, formatMktCap
- `src/types/index.ts` — StockResult interface
- `src/components/ui/switch.tsx`, `src/components/ui/slider.tsx` — data-slot pattern reference
- T01 output: ProgressBar component, scan runner wired

## Expected Output

- `src/components/ui/tooltip.tsx` — Radix Tooltip data-slot wrapper
- `src/components/main/ScoreTooltip.tsx` — 4-component score breakdown tooltip
- `src/components/main/ResultsTable.tsx` — 12-column sortable table with gradient bars
- `src/components/main/KpiCards.tsx` — 4 KPI summary cards with count-up animation
- `src/components/main/EmptyState.tsx` — Pre-scan and zero-results states
- `src/App.tsx` — Main area composed with all components
- `src/main.tsx` — TooltipProvider added
