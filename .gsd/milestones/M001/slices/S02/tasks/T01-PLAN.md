---
estimated_steps: 5
estimated_files: 8
---

# T01: Build Zustand stores and wire TanStack Query provider

**Slice:** S02 — State Management + API Services
**Milestone:** M001

## Description

Create the 6 Zustand stores that replace vanilla JS global variables. Each store has a well-defined shape from the research doc. Two stores (apiKeyStore, themeStore) persist to localStorage with versioned schemas and migrate functions. filterStore must handle the Preset→FilterState type conversion (Preset has string targetDTE/targetDelta, FilterState has numbers). Wire TanStack Query's QueryClientProvider at app root for S05/S06 hooks.

## Steps

1. Install zustand and @tanstack/react-query as dependencies.
2. Create `src/stores/filter-store.ts` — Zustand store with full FilterState shape. Default values parsed from PRESETS.finviz_cut2. Actions: `setFilter(key, value)`, `resetFilters()`, `applyPreset(presetName)`. applyPreset must parseInt targetDTE and parseFloat targetDelta from Preset strings. Map Preset boolean field names (dividends→requireDividends, sma200→aboveSMA200, earnings→excludeEarnings, weeklies→requireWeeklies, riskySectors→excludeRiskySectors).
3. Create `src/stores/results-store.ts` — allResults/filteredResults arrays + sort config (key + dir). Actions: setResults, setSortKey (toggle dir on same key), clearResults. Default sort: wheelScore desc.
4. Create `src/stores/scan-store.ts` — ScanProgress fields + earningsMap. Actions: startScan(totalCount), tickProgress(ticker), completeScan(), failScan(error), resetScan(), setEarningsMap(map).
5. Create `src/stores/api-key-store.ts` — ApiKeys shape with persist middleware. Persist key: `wheelscan-api-keys`, version: 1. partialize to exclude `status` (derived from key presence on read via a getter pattern or computed in the selector). Actions: setFinnhubKey, setAlpacaKeys, setMassiveKey, clearAllKeys.
6. Create `src/stores/theme-store.ts` — theme: 'dark'|'light' with persist middleware. Persist key: `wheelscan-theme`, version: 1. Actions: toggleTheme(), setTheme(theme). toggleTheme also updates document.documentElement classList.
7. Create `src/stores/chain-store.ts` — ChainData|null + loading + error. Actions: setChainData, setSelectedExpiry, setLoading, setError, clearChain.
8. Wire QueryClientProvider in `src/main.tsx` — create QueryClient with sensible defaults (staleTime: 5min for option data, retry: 1), wrap App.
9. Write `src/stores/__tests__/stores.test.ts` covering: filterStore defaults match finviz_cut2 parsed values, applyPreset converts string→number correctly for all 3 presets, setFilter updates individual fields, resetFilters returns to defaults; resultsStore set/clear/sort toggle; scanStore lifecycle (start→tick→complete, start→tick→fail); apiKeyStore set keys and derived status, persist serialization excludes status; themeStore toggle and persist; chainStore set/clear lifecycle.

## Must-Haves

- [ ] filterStore.applyPreset('conservative') produces targetDTE=45 (number) and targetDelta=0.20 (number)
- [ ] apiKeyStore persist partializes out `status` — only key strings are serialized
- [ ] themeStore toggleTheme updates document.documentElement.classList
- [ ] scanStore state machine: idle→running→complete and idle→running→error transitions
- [ ] QueryClientProvider wraps App in main.tsx without breaking existing render
- [ ] All stores have correct TypeScript types — tsc --noEmit passes

## Verification

- `npx vitest run src/stores/__tests__/` — all store tests pass
- `npx tsc --noEmit` — zero errors
- `npm run dev` — dev server starts, renders app without console errors

## Inputs

- `src/types/index.ts` — FilterState, StockResult, ScanProgress, ChainData, ApiKeys, WeightConfig, Preset interfaces
- `src/lib/constants.ts` — PRESETS (string-typed targetDTE/targetDelta), DEFAULT_WEIGHTS
- S01 Forward Intelligence — Preset→FilterState conversion is fragile, must parseInt/parseFloat

## Expected Output

- `src/stores/filter-store.ts` — filterStore with applyPreset handling type conversion
- `src/stores/results-store.ts` — resultsStore with sort toggle
- `src/stores/scan-store.ts` — scanStore with progress lifecycle
- `src/stores/api-key-store.ts` — apiKeyStore with localStorage persistence
- `src/stores/theme-store.ts` — themeStore with localStorage persistence + DOM sync
- `src/stores/chain-store.ts` — chainStore for option chain UI state
- `src/main.tsx` — updated with QueryClientProvider
- `src/stores/__tests__/stores.test.ts` — comprehensive store tests
