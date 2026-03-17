# S02: State Management + API Services — UAT

**Milestone:** M001
**Written:** 2026-03-12

## UAT Type

- UAT mode: artifact-driven
- Why this mode is sufficient: This slice produces stores and service clients tested entirely via Vitest. No UI components or live API calls — all contracts verified by 60 unit tests and tsc.

## Preconditions

- `npm install` has completed
- Node 18+ available

## Smoke Test

Run `npx vitest run src/stores/__tests__/ src/services/__tests__/` — all 60 tests pass.

## Test Cases

### 1. All stores have correct initial state

1. Run `npx vitest run src/stores/__tests__/stores.test.ts`
2. **Expected:** 33 tests pass — filterStore defaults to finviz_cut2 values, scanStore phase is 'idle', apiKeyStore status fields are 'untested', themeStore defaults to 'dark'

### 2. filterStore.applyPreset converts string→number

1. In test: call `useFilterStore.getState().applyPreset('conservative')`
2. Check `useFilterStore.getState().targetDTE` and `targetDelta`
3. **Expected:** targetDTE is 45 (number, not "45"), targetDelta is 0.20 (number, not "0.20")

### 3. apiKeyStore persists to localStorage

1. In test: set a Finnhub key, check localStorage
2. Clear store, rehydrate from localStorage
3. **Expected:** Key survives round-trip. Status field is NOT in serialized data (excluded by partialize).

### 4. Rate limiter throttles concurrent calls

1. Run `npx vitest run src/services/__tests__/rate-limiter.test.ts`
2. **Expected:** 6 tests pass — bucket starts full, drains on acquire, blocks when empty, refills on interval, FIFO ordering, dispose stops interval

### 5. Service clients construct correct URLs and auth

1. Run `npx vitest run src/services/__tests__/services.test.ts`
2. **Expected:** 21 tests pass — FinnhubService uses query-param `?token=`, AlpacaService uses header `APCA-API-KEY-ID`, MassiveService uses `?apiKey=`

### 6. TypeScript compilation is clean

1. Run `npx tsc --noEmit`
2. **Expected:** Zero errors. All store and service types align with src/types/index.ts interfaces.

### 7. Dev server renders with QueryClientProvider

1. Run `npm run dev`
2. Open http://localhost:5173
3. **Expected:** App renders WheelScan heading. No JS console errors related to React Query or store initialization.

## Edge Cases

### AbortSignal cancellation

1. In test: pass an already-aborted signal to a FinnhubService method
2. **Expected:** fetch rejects with AbortError, no retry attempted

### Unknown preset name

1. Call `applyPreset('nonexistent')`
2. **Expected:** console.warn fires, state unchanged

### Rate limiter dispose prevents leaks

1. Create limiter, call dispose()
2. **Expected:** Internal interval cleared. No dangling timers in test runner.

## Failure Signals

- Any Vitest test failure in `src/stores/__tests__/` or `src/services/__tests__/`
- TypeScript errors from `npx tsc --noEmit`
- Console errors on dev server page load (especially around QueryClientProvider)
- localStorage keys missing after apiKeyStore/themeStore mutations

## Requirements Proved By This UAT

- R006 — 6 Zustand stores with persist middleware (33 tests)
- R007 — Typed API services with token-bucket rate limiter (27 tests)
- R008 — TanStack Query v5 QueryClientProvider wired (dev server renders)

## Not Proven By This UAT

- R008 useMutation/useQuery hook usage — deferred to S05 (scan flow) and S06 (chain modal)
- Real API integration — services tested with mocked fetch only
- UI binding to stores — deferred to S04 (sidebar controls)
- localStorage persistence across browser sessions — tested in jsdom, not real browser

## Notes for Tester

- All tests use fake timers for rate limiter — no real delays
- The 404 in dev server console is just a missing favicon — not a real error
- Store state is inspectable via `useXxxStore.getState()` in browser console
