---
id: T01
parent: S02
milestone: M001
provides:
  - 6 Zustand stores with correct types and state transitions
  - apiKeyStore and themeStore with versioned localStorage persistence
  - filterStore with Preset→FilterState type conversion (string→number)
  - QueryClientProvider wired at app root
key_files:
  - src/stores/filter-store.ts
  - src/stores/results-store.ts
  - src/stores/scan-store.ts
  - src/stores/api-key-store.ts
  - src/stores/theme-store.ts
  - src/stores/chain-store.ts
  - src/main.tsx
  - src/stores/__tests__/stores.test.ts
key_decisions:
  - Derived apiKeyStore.status via deriveStatus() helper called after every mutation — never serialized, always computed fresh on rehydrate via merge()
  - scanStore uses explicit phase enum (idle|running|complete|error) instead of inferring from boolean flags — clearer state machine
  - themeStore applies DOM classList changes inside action callbacks and on rehydrate via onRehydrateStorage
  - Test environment switched from node to jsdom for localStorage and DOM classList access
patterns_established:
  - Zustand stores in src/stores/ with one store per file, exported as useXxxStore hooks
  - Persist middleware with version:1 and partialize for excluding derived state
  - presetToFilterState() handles all Preset→FilterState field mapping in one place
observability_surfaces:
  - localStorage keys wheelscan-api-keys and wheelscan-theme inspectable in devtools
  - filterStore console.warn on unknown preset names
duration: 15m
verification_result: passed
completed_at: 2026-03-12
blocker_discovered: false
---

# T01: Build Zustand stores and wire TanStack Query provider

**Created 6 Zustand stores with full type coverage, localStorage persistence for api-keys and theme, and wired QueryClientProvider at app root.**

## What Happened

Installed zustand and @tanstack/react-query. Built all 6 stores matching the type interfaces from src/types/index.ts:

- **filterStore**: defaults from PRESETS.finviz_cut2 with parseInt/parseFloat conversion for targetDTE/targetDelta. Boolean field mapping (dividends→requireDividends, etc.) handled by presetToFilterState(). applyPreset works for all 3 presets.
- **resultsStore**: allResults/filteredResults with sort config. setSortKey toggles direction on same key, resets to desc on new key.
- **scanStore**: phase-based state machine (idle→running→complete, idle→running→error). Tracks progress, currentTicker, scannedCount, candidateCount, earningsMap.
- **apiKeyStore**: persist middleware with partialize excluding status. Status derived from key presence via deriveStatus() helper, recomputed on every mutation and on rehydrate.
- **themeStore**: persist middleware with DOM sync via classList. onRehydrateStorage applies theme on page load.
- **chainStore**: ChainData|null with loading/error. setSelectedExpiry is no-op when no data loaded.

Switched vitest environment to jsdom (from node) and installed jsdom + @testing-library/jest-dom. Wired QueryClientProvider in main.tsx with staleTime: 5min, retry: 1, refetchOnWindowFocus: false.

## Verification

- `npx vitest run src/stores/__tests__/` — **33 tests pass** covering all stores
- `npx tsc --noEmit` — **zero errors**
- `npm run dev` — app renders at localhost:5173, no JS console errors
- Confirmed: filterStore.applyPreset('conservative') produces targetDTE=45 (number), targetDelta=0.20 (number)
- Confirmed: apiKeyStore persist serialization excludes status field
- Confirmed: themeStore toggleTheme updates document.documentElement.classList

**Slice-level verification (partial):**
- ✅ `npx vitest run src/stores/__tests__/` — passes
- ⬜ `npx vitest run src/services/__tests__/` — T02 scope
- ✅ `npx tsc --noEmit` — passes
- ✅ `npm run dev` — passes

## Diagnostics

- localStorage keys `wheelscan-api-keys` and `wheelscan-theme` inspectable in browser devtools
- filterStore logs `console.warn` for unknown preset names
- Stores are standard Zustand — getState()/setState() available for debugging in console

## Deviations

- Added `incrementCandidates()` action to scanStore (not in original plan) — needed for scan flow to track candidate count independently of tickProgress
- Switched test environment from node to jsdom — required for localStorage and DOM classList tests

## Known Issues

None.

## Files Created/Modified

- `src/stores/filter-store.ts` — filterStore with presetToFilterState conversion
- `src/stores/results-store.ts` — resultsStore with sort toggle
- `src/stores/scan-store.ts` — scanStore with phase-based lifecycle
- `src/stores/api-key-store.ts` — apiKeyStore with persist + derived status
- `src/stores/theme-store.ts` — themeStore with persist + DOM sync
- `src/stores/chain-store.ts` — chainStore for option chain UI state
- `src/main.tsx` — wrapped App in QueryClientProvider
- `src/stores/__tests__/stores.test.ts` — 33 tests covering all stores
- `vite.config.ts` — switched test environment to jsdom
- `package.json` — added zustand, @tanstack/react-query, jsdom, @testing-library/jest-dom
