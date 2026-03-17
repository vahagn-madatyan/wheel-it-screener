# M002: PR Review Fixes — Correctness, Resilience & Cleanup

**Vision:** Fix all critical and important issues from the PR #2 review. After this milestone, the app handles errors visibly instead of swallowing them, data correctness bugs are fixed, and dead code is cleaned up.

## Success Criteria

- Market cap filter correctly excludes stocks outside the configured range using Finnhub's million-dollar unit
- Empty catch blocks are replaced with proper error propagation/logging throughout chain and scan code
- `useChainQuery` cache key includes all parameters that affect query results
- `computeWheelScore` returns 0 (not NaN) when all weights are zero
- Failed tickers and partial data warnings are visible to the user
- Scan phase labels display during scan progress
- React Error Boundary catches render crashes with a recovery UI
- Dead types, stale JSDoc, and dead fields are removed
- `ChainParams` uses discriminated union — no `!` assertions on optional keys
- API keys use `sessionStorage` (not `localStorage`) with a UI warning
- All existing 222 tests still pass plus new tests for `runScan()` and `fetchChain()` dispatchers
- ESLint + Prettier + tsc clean

## Key Risks / Unknowns

- Market cap unit change cascades to filters, CSV export, and test fixtures — need to verify all downstream consumers
- Switching API key storage from `localStorage` to `sessionStorage` changes Zustand persist config — must not break rehydration
- `ScanResult.failedTickers` is a new return shape — callers in useScanRunner must adapt

## Proof Strategy

- Market cap cascade → retire in S01 by fixing filter math + CSV + tests and verifying in browser with a real scan
- API key storage → retire in S01 by switching persist config and verifying keys survive page refresh within session but not across sessions
- ScanResult shape → retire in S02 by wiring failedTickers through to UI and verifying display

## Verification Classes

- Contract verification: Vitest tests (existing 222 + new scanner/chain dispatcher tests)
- Integration verification: `npm run build` clean, `npx eslint .` + `npx prettier --check .` pass
- Operational verification: none
- UAT / human verification: browser verification of error states, progress phases, and error boundary

## Milestone Definition of Done

This milestone is complete only when all are true:

- All 5 slices complete with individual verification
- All Vitest tests pass (existing + new)
- `tsc --noEmit`, `eslint .`, `prettier --check .` all exit 0
- `npm run build` succeeds without chunk size warnings
- Browser verification confirms: market cap filtering works, error states are visible, phase labels display, error boundary catches crashes

## Requirement Coverage

- Covers: none (new requirements — these are correctness/quality fixes)
- Partially covers: R004 (scoring parity — market cap fix), R019 (scan flow — error visibility), R021 (chain modal — error handling)
- Leaves for later: none

## Slices

- [x] **S01: Critical data correctness fixes** `risk:high` `depends:[]`
  > After this: Market cap filter works correctly, chain OI errors are logged, API keys use sessionStorage. Verified by updated unit tests and browser scan.

- [x] **S02: Error visibility & user feedback** `risk:medium` `depends:[S01]`
  > After this: Failed tickers show count in results UI, earnings data warnings surface, scan phase labels display in progress bar. Verified in browser during a real scan.

- [x] **S03: Type safety & React resilience** `risk:medium` `depends:[]`
  > After this: ChainParams uses discriminated union (no `!` assertions), computeWheelScore guards zero-weight, React Error Boundary catches crashes, Suspense fallback handles chunk load failures. Verified by tsc + tests + intentional error trigger in browser.

- [x] **S04: Cache key fix & hook cleanup** `risk:low` `depends:[S01]`
  > After this: useChainQuery cache key includes all deps, StockFiltersSection uses useShallow, ScoringWeightsSection callback is properly memoized, duplicate service instantiation removed. Verified by tsc + tests.

- [x] **S05: Dead code removal & test coverage** `risk:low` `depends:[S01,S02,S03]`
  > After this: Dead ScanProgress type removed, stale JSDoc fixed, minPremium field resolved, tickerUniverse narrowed to union type, new tests for runScan() and fetchChain() dispatchers. Verified by all tests passing + eslint + prettier clean.

## Boundary Map

### S01 → S02

Produces:
- `ScanResult` type with `failedTickers: string[]` field
- Consistent error logging pattern in scan.ts catch blocks
- Market cap stored in raw dollars (not Finnhub millions) in `StockResult.marketCap`

Consumes:
- nothing (first slice)

### S01 → S04

Produces:
- Stable `ChainParams` type (S03 refactors it, but S04 only touches hooks that consume it)

Consumes:
- nothing (first slice)

### S03 → S05

Produces:
- Discriminated union `ChainParams` type
- Error Boundary component

Consumes:
- nothing (parallel with S01)

### S02 → S05

Produces:
- `ScanResult.failedTickers` wired to UI
- Phase label display in progress bar

Consumes:
- S01's `ScanResult` shape changes
