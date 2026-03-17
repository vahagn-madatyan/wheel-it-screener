# S04: Sidebar Controls — Research

**Date:** 2026-03-15 (retroactive — slice completed 2026-03-12)

## Summary

S04 populates the existing sidebar skeleton (from S03) with all interactive controls: API key masked inputs, filter preset selector, ticker universe/custom tickers, ~14 numeric filter fields, 5 boolean toggles, DTE/delta selects, and 4 scoring weight sliders with a sum-to-100 constraint. All controls two-way bind to `useFilterStore` and `useApiKeyStore` from S02.

**This slice is already fully implemented and verified.** All 8 sidebar component files exist under `src/components/sidebar/`, two UI primitives (Switch, Slider) under `src/components/ui/`, 196 tests pass (including 8 weight redistribution tests), and the full sidebar renders in the browser at localhost:5173. This research documents the completed state and captures forward intelligence for S05.

The implementation decomposed cleanly into reusable primitives (NumberInput, ApiKeyInput, Switch, Slider) composed into 4 section components (ApiKeysSection, StockFiltersSection, WheelCriteriaSection, ScoringWeightsSection) plus ActionButtons. The weight redistribution logic was extracted as a pure function (`redistributeWeights`) with 8 dedicated test cases verifying proportional distribution, rounding, and edge cases.

## Target Requirements

| Req | Description | Status |
|-----|-------------|--------|
| R012 | Sidebar controls wired to filter store | ✅ Validated — all ~25 filter inputs rendered and bound |
| R013 | API key inputs with masked fields + status badges | ✅ Validated — 4 inputs with eye toggle, green/neutral badges |
| R014 | Filter presets | ✅ Validated — dropdown with derived detection, applyPreset wired |
| R015 | Visual weight sliders | ✅ Validated — 4 sliders with proportional redistribution, Total: 100% |

## Recommendation

No further implementation needed — slice is complete. S05 should consume the sidebar state as-is. Key integration points:

1. **Run Screener button** in `ActionButtons.tsx` needs an `onClick` handler wired to the scan mutation (S05 scope)
2. **Filter state** is available via `useFilterStore.getState()` — returns full `FilterState` matching what `filterStocks()` expects
3. **API keys** are available via `useApiKeyStore.getState()` — `finnhubKey` must be non-empty for scan to proceed (already enforced by Run button disabled state)

## Don't Hand-Roll

| Problem | Existing Solution | Why Use It |
|---------|------------------|------------|
| Toggle switches | `@radix-ui/react-switch` (via radix-ui@1.4.3) | Already wired in `src/components/ui/switch.tsx` |
| Weight sliders | `@radix-ui/react-slider` (via radix-ui@1.4.3) | Already wired in `src/components/ui/slider.tsx` with single-value adapter |
| Collapsible sections | `@radix-ui/react-collapsible` | Established in S03's `SidebarSection.tsx` |
| CSS class merging | `cn()` from `src/lib/utils.ts` | clsx + tailwind-merge, used everywhere |
| Weight redistribution | `redistributeWeights()` in `ScoringWeightsSection.tsx` | Pure function, 8 tests, handles all edge cases |

## Existing Code and Patterns

### UI Primitives (src/components/ui/)
- `switch.tsx` — Radix Switch wrapper with `data-slot` pattern, dark-theme styling via `data-[state=checked]:bg-primary`
- `slider.tsx` — Radix Slider wrapper with single-value adapter (wraps/unwraps Radix's array API), track/range/thumb with theme tokens
- `collapsible.tsx` — Radix Collapsible wrapper from S03, pattern reference for any new Radix wrappers

### Sidebar Components (src/components/sidebar/)
- `NumberInput.tsx` — Internal string draft state prevents cursor-jumping; commits on blur/Enter; converts `undefined ↔ ""` for optional fields (`maxDebtEquity`, `minNetMargin`, `minSalesGrowth`, `minROE`); clamps to min/max
- `ApiKeyInput.tsx` — Password masking with eye toggle (Eye/EyeOff from lucide-react), status badge ("Set" green / "Not Set" neutral), label-to-ID sanitization handles dots in "Massive.com"
- `ApiKeysSection.tsx` — Composes 4 ApiKeyInput instances; Alpaca coordinated update reads other field from `getState()` at call time
- `StockFiltersSection.tsx` — Preset dropdown with derived detection via `useMemo(detectPreset)` comparing full store state to PRESETS; ticker universe select; 10 numeric filter fields in 2-column grid
- `WheelCriteriaSection.tsx` — DTE/delta native selects with `parseInt`/`parseFloat` conversion; premium/BP/IV number inputs; 5 Radix Switch toggles via ToggleRow pattern
- `ScoringWeightsSection.tsx` — 4 weight sliders; `redistributeWeights` pure function with proportional distribution and fractional-sort remainder; batch-sets all 4 weights via `setFilter` loop
- `ActionButtons.tsx` — Run Screener (disabled without Finnhub key, with CSS tooltip explaining why) + Reset to Defaults

### Store Integration
- `useFilterStore` — `setFilter(key, value)` generic setter handles all FilterState fields; `applyPreset(name)` applies full preset; `resetFilters()` returns to Finviz Cut 2 defaults
- `useApiKeyStore` — Per-provider setters; `status` is derived (Decision #19) — always fresh when read
- `useScanStore` — `phase` read by ActionButtons to disable Run during scan

### App Integration
- `src/App.tsx` — Composes all 4 sections as SidebarSection children inside Sidebar inside DashboardLayout's sidebar slot

## Constraints

- **Decision #23:** Write shadcn components manually — CLI creates wrong paths and imports
- **Decision #17:** FilterState uses `number | undefined` for optional numeric fields — not NaN
- **4 weights, not 6:** Despite R015 mentioning "6 weights", the actual `WeightConfig` type has 4 composite categories (Premium, Liquidity, Stability, Fundamentals). The 6-factor scoring model maps to these 4 user-facing categories. Types are authoritative.
- **Preset targetDTE/targetDelta are strings** in `Preset` type but numbers in `FilterState`. The `presetToFilterState` function handles conversion — no extra work needed.
- **Native `<select>` for dropdowns** — chosen over Radix Select for simplicity. Limitation: Playwright `selectOption` can't fire React synthetic `onChange`, so automated E2E testing of selects requires workarounds.

## Common Pitfalls

- **NumberInput draft state vs store state** — The internal string state commits on blur/Enter, meaning reading the store mid-edit may not reflect what's displayed. Functionally correct (prevents cursor jumping) but could confuse if scan reads state while user is actively typing. S05 should not worry — scan reads committed store state.
- **Weight redistribution integer rounding** — The `redistributeWeights` function uses fractional-sort remainder assignment to guarantee integer sum = 100. Verified by 8 tests including edge cases (all-others-zero, one-to-100). No drift possible.
- **Preset detection performance** — `detectPreset` in `useMemo` compares ~20 fields against 3 presets on every relevant state change. This is O(60) comparisons — negligible. No optimization needed.
- **Alpaca coordinated update** — `setAlpacaKeys(keyId, secretKey)` requires both values. Each individual field change reads the other field from `getState()` at call time — not from closure. Correct pattern, but would break if someone refactored to use stale closure values.

## Open Risks

- **None for S04** — slice is complete and verified.
- **For S05 integration:** The Run Screener button's `onClick` is not yet wired — S05 must add the scan handler. The `disabled` logic is already correct (checks phase + Finnhub key status).

## Skills Discovered

| Technology | Skill | Status |
|------------|-------|--------|
| Radix UI | `sickn33/antigravity-awesome-skills@radix-ui-design-system` (258 installs) | available — not needed (primitives already wired) |
| Zustand | `wshobson/agents@react-state-management` (4.1K installs) | available — not needed (patterns established in S02) |
| shadcn/ui | `shadcn/ui@shadcn` (16.1K installs) | available — not needed (Decision #23: write manually) |

No skills installed — all patterns are established in the codebase and working correctly.

## Sources

- Radix Slider API: Root accepts `value`, `onValueChange`, `min`, `max`, `step`. Renders Track > Range > Thumb. (source: Radix Primitives docs via resolve_library)
- Radix Switch API: Root accepts `checked`, `onCheckedChange`, `disabled`. Data attributes `data-state="checked"|"unchecked"`. (source: Radix Primitives docs)
- Vanilla sidebar structure: 4 sections (API Keys, Stock Filters, Wheel Criteria, Scoring Weights) + Run/Reset buttons (source: `index.vanilla.html:30-290`)
- Strategy filter spec: D/E ratio, net margin, sales growth, ROE, sector exclusion with preset values (source: `STRATEGY_FILTERS.md`)
- Scoring normalization: `totalWeight = sum of 4 weights`, score divided by totalWeight (source: `src/lib/scoring.ts`)
