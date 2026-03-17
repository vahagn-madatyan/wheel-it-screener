# S04: Sidebar Controls

**Goal:** All sidebar filter controls rendered, bound to Zustand stores, and interactive — presets switch values, toggles toggle, weight sliders redistribute, API key inputs mask/unmask with status badges.
**Demo:** Open dev server → sidebar shows 4 collapsible sections (API Keys, Stock Filters, Wheel Criteria, Scoring Weights) with all controls functional → change preset dropdown → all filter fields update → toggle a switch → store value changes → move weight slider → other sliders redistribute to maintain sum ≈ 100 → enter API key → status badge shows "Set" → click Reset → all values return to defaults.

## Must-Haves

- All ~25 filter controls from vanilla sidebar rendered in React sidebar sections
- Two-way binding between controls and `useFilterStore` / `useApiKeyStore`
- 3 preset options + "Custom" state when any filter is manually changed
- 4 weight sliders with proportional redistribution when one changes
- API key inputs with password masking, show/hide toggle, and status badges
- 5 boolean toggles using Radix Switch
- DTE and Delta dropdowns with correct option values
- Ticker universe selector + custom tickers text input
- Run Screener + Reset to Defaults action buttons
- `npx tsc --noEmit` passes, all existing tests pass, no regressions

## Proof Level

- This slice proves: integration (controls ↔ stores two-way binding)
- Real runtime required: yes (browser verification of control interactions)
- Human/UAT required: no

## Verification

- `npx tsc --noEmit` — zero errors
- `npx vitest run` — all tests pass (188 existing + new weight redistribution tests)
- `src/components/sidebar/__tests__/weight-redistribution.test.ts` — proportional redistribution logic produces correct outputs
- Browser: preset dropdown changes all filter values in store
- Browser: Reset button returns all filters to defaults
- Browser: all 4 sidebar sections render with controls inside collapsible containers
- Browser: weight slider change redistributes remaining sliders proportionally

## Observability / Diagnostics

- Runtime signals: filterStore console.warn on unknown preset names (existing from S02)
- Inspection surfaces: `useFilterStore.getState()` / `useApiKeyStore.getState()` from browser console; Zustand devtools
- Failure visibility: store state directly inspectable; controls show current store values via two-way binding
- Redaction constraints: API key values never logged; status badges show "Set"/"Not Set" only

## Integration Closure

- Upstream surfaces consumed: `useFilterStore` (setFilter, applyPreset, resetFilters), `useApiKeyStore` (setFinnhubKey, setAlpacaKeys, setMassiveKey, status), `SidebarSection` (collapsible container), `Sidebar` (nav wrapper), `DashboardLayout` (sidebar slot), `PRESETS` and `TICKER_LISTS` constants
- New wiring introduced in this slice: sidebar section components injected as children of SidebarSection in App.tsx; Radix Switch and Slider primitives added to src/components/ui/
- What remains before the milestone is truly usable end-to-end: S05 (scan flow + results), S06 (chain modal), S07 (visual polish), S08 (cleanup + deploy)

## Tasks

- [x] **T01: Build reusable UI primitives and API Keys section** `est:35m`
  - Why: Establishes all reusable input patterns (Switch, Slider, NumberInput, ApiKeyInput) that T02's section compositions depend on. API Keys section validates store binding pattern end-to-end.
  - Files: `src/components/ui/switch.tsx`, `src/components/ui/slider.tsx`, `src/components/sidebar/NumberInput.tsx`, `src/components/sidebar/ApiKeyInput.tsx`, `src/components/sidebar/ApiKeysSection.tsx`
  - Do: Write Radix Switch wrapper (data-slot pattern from collapsible.tsx, styled with data-state selectors). Write Radix Slider wrapper (Track > Range > Thumb, emerald accent). Build NumberInput with label, step, min/max, and `undefined ↔ empty string` conversion for optional fields. Build ApiKeyInput with `type="password"` toggle, eye icon, and status badge from apiKeyStore.status. Compose ApiKeysSection with 3 inputs (Finnhub, Alpaca Key ID + Secret, Massive) bound to apiKeyStore setters.
  - Verify: `npx tsc --noEmit` zero errors, `npx vitest run` no regressions, dev server shows API Keys section with functional inputs
  - Done when: All 4 UI primitives exported, ApiKeysSection renders in browser with masked inputs, show/hide toggles, and status badges reflecting store state

- [x] **T02: Build filter sections, weight sliders, action buttons, and wire App.tsx** `est:45m`
  - Why: Composes all remaining sidebar sections using T01 primitives, adds weight redistribution logic, and replaces App.tsx placeholders with real controls — completing the sidebar.
  - Files: `src/components/sidebar/StockFiltersSection.tsx`, `src/components/sidebar/WheelCriteriaSection.tsx`, `src/components/sidebar/ScoringWeightsSection.tsx`, `src/components/sidebar/ActionButtons.tsx`, `src/App.tsx`, `src/components/sidebar/__tests__/weight-redistribution.test.ts`
  - Do: Build StockFiltersSection with preset dropdown (3 presets + "Custom" state tracked locally via useEffect on filter changes), ticker universe select, custom tickers input, ~10 paired NumberInputs for price/mktcap/volume/PE/DE/margin/growth/ROE. Build WheelCriteriaSection with premium/BP NumberInputs, DTE/delta native selects, IV rank NumberInputs, 5 Radix Switch toggles. Build ScoringWeightsSection with 4 Radix Sliders using `redistributeWeights(changedKey, newValue, currentWeights)` pure function — proportionally redistributes difference across other 3 weights, clamps at 0, assigns rounding remainder to largest. Extract `redistributeWeights` as testable pure function. Build ActionButtons with Run Screener (reads scanStore.phase, disabled when phase=running or no Finnhub key — actual scan handler wired in S05) and Reset to Defaults (calls filterStore.resetFilters). Replace 3 placeholder SidebarSections in App.tsx with real sections.
  - Verify: `npx tsc --noEmit` zero errors, `npx vitest run` all tests pass including new weight redistribution tests, browser shows all 4 sections with functional controls, preset changes update all fields, Reset restores defaults
  - Done when: All sidebar controls render and bind to stores, preset switching works, weight redistribution keeps sum ≈ 100, Run/Reset buttons present, no placeholder text remains in sidebar

## Files Likely Touched

- `src/components/ui/switch.tsx`
- `src/components/ui/slider.tsx`
- `src/components/sidebar/NumberInput.tsx`
- `src/components/sidebar/ApiKeyInput.tsx`
- `src/components/sidebar/ApiKeysSection.tsx`
- `src/components/sidebar/StockFiltersSection.tsx`
- `src/components/sidebar/WheelCriteriaSection.tsx`
- `src/components/sidebar/ScoringWeightsSection.tsx`
- `src/components/sidebar/ActionButtons.tsx`
- `src/components/sidebar/__tests__/weight-redistribution.test.ts`
- `src/App.tsx`
