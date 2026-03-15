---
estimated_steps: 5
estimated_files: 7
---

# T02: Build filter sections, weight sliders, action buttons, and wire App.tsx

**Slice:** S04 — Sidebar Controls
**Milestone:** M001

## Description

Compose the remaining 3 sidebar sections (Stock Filters, Wheel Criteria, Scoring Weights) using T01's primitives, add action buttons (Run/Reset), write weight redistribution logic with tests, and replace App.tsx placeholders with real sidebar content.

## Steps

1. **StockFiltersSection** (`src/components/sidebar/StockFiltersSection.tsx`): Preset dropdown (3 presets + "Custom") at top. Local state `currentPreset` tracks which preset is active — initialized from comparing current filterStore state to PRESETS, set to "Custom" on any manual `setFilter` call (use `useEffect` on filter state changes), set to preset name when `applyPreset` is called. Ticker universe native `<select>` with 4 options (wheel_popular, sp500_top, high_dividend, custom). Custom tickers text input. Paired NumberInput rows: Price (min/max), Mkt Cap (min/max), Volume/PE, D/E Ratio/Net Margin (optional — use `undefined` handling), Sales Growth/ROE (optional). All bound to filterStore via `setFilter`.

2. **WheelCriteriaSection** (`src/components/sidebar/WheelCriteriaSection.tsx`): Premium/BP NumberInputs in a row. DTE native `<select>` with options 30/45/60/90. Delta native `<select>` with options 0.20/0.25/0.30/0.35/0.40 (labels matching vanilla). IV Rank min/max NumberInputs. 5 Radix Switch toggles: Require Dividends, Above 200-day SMA, Exclude Earnings (within 14d), Has Weekly Options, Exclude Risky Sectors. All bound to filterStore.

3. **ScoringWeightsSection + redistributeWeights** (`src/components/sidebar/ScoringWeightsSection.tsx`): 4 Radix Sliders (Premium, Liquidity, Stability, Fundamentals) with labels showing current value and percentage. Extract `redistributeWeights(changedKey: keyof WeightConfig, newValue: number, weights: WeightConfig): WeightConfig` as a pure function (export for testing). Logic: compute diff from old to new value, distribute negative-diff proportionally across other 3 weights by their current share of remaining total, clamp at 0, assign integer rounding remainder to the largest of the other 3. Each slider's onValueChange calls redistributeWeights then batch-sets all 4 weights via setFilter.

4. **Weight redistribution tests** (`src/components/sidebar/__tests__/weight-redistribution.test.ts`): Test redistributeWeights: (a) increase one weight → others decrease proportionally, (b) decrease one weight → others increase proportionally, (c) set one weight to 100 → others become 0, (d) set one weight to 0 → others increase proportionally, (e) rounding preserves sum=100, (f) edge case: two others at 0, only one absorbs the change.

5. **ActionButtons + App.tsx wiring** (`src/components/sidebar/ActionButtons.tsx`, `src/App.tsx`): Run Screener button reads `useScanStore(s => s.phase)` and `useApiKeyStore(s => s.status.finnhub)` — disabled when phase='running' or finnhub status='not_set'. No onClick handler yet (S05 wires scan). Shows disabled state with tooltip explanation. Reset to Defaults button calls `filterStore.resetFilters()`. Replace 3 placeholder SidebarSection components in App.tsx with ApiKeysSection + StockFiltersSection + WheelCriteriaSection + ScoringWeightsSection + ActionButtons, wrapped in appropriate SidebarSection containers.

## Must-Haves

- [ ] StockFiltersSection renders all numeric filter fields from vanilla sidebar
- [ ] Preset dropdown switches all filter values and tracks "Custom" state on manual changes
- [ ] WheelCriteriaSection renders DTE/delta selects, premium/BP/IV fields, and 5 toggles
- [ ] Weight sliders redistribute proportionally, tested via Vitest
- [ ] `redistributeWeights` pure function exported and tested with ≥5 cases
- [ ] ActionButtons render Run (disabled state logic) and Reset
- [ ] App.tsx has zero placeholder text — all sidebar sections contain real controls
- [ ] `npx tsc --noEmit` passes
- [ ] `npx vitest run` passes all tests including new weight redistribution tests

## Verification

- `npx tsc --noEmit` — zero errors
- `npx vitest run` — all tests pass (188 existing + new weight redistribution tests)
- Browser: select "Conservative" preset → all filter fields update to conservative values
- Browser: manually change a filter → preset dropdown shows "Custom"
- Browser: move Premium weight slider to 50 → other 3 sliders decrease proportionally, total ≈ 100
- Browser: click Reset → all fields return to Finviz Cut 2 defaults
- Browser: no placeholder text visible in sidebar

## Inputs

- `src/components/ui/switch.tsx` — Radix Switch from T01
- `src/components/ui/slider.tsx` — Radix Slider from T01
- `src/components/sidebar/NumberInput.tsx` — NumberInput from T01
- `src/components/sidebar/ApiKeysSection.tsx` — composed section from T01
- `src/stores/filter-store.ts` — filterStore with setFilter, applyPreset, resetFilters
- `src/stores/scan-store.ts` — scanStore for Run button disabled state
- `src/lib/constants.ts` — PRESETS, TICKER_LISTS constants

## Expected Output

- `src/components/sidebar/StockFiltersSection.tsx` — preset + ticker + numeric filter controls
- `src/components/sidebar/WheelCriteriaSection.tsx` — wheel strategy controls + toggles
- `src/components/sidebar/ScoringWeightsSection.tsx` — 4 weight sliders with redistribution
- `src/components/sidebar/ActionButtons.tsx` — Run + Reset buttons
- `src/components/sidebar/__tests__/weight-redistribution.test.ts` — redistribution unit tests
- `src/App.tsx` — sidebar wired with all real section components
