---
id: T01
parent: S02
milestone: M003-8nlgd1
provides:
  - Pharmaceuticals removed from EXCLUDED_INDUSTRIES (R038)
  - E&P exclusion safety proven via test (R039)
  - EXCLUDED_TICKERS count asserted at 28 (R040)
key_files:
  - src/lib/constants.ts
  - src/lib/__tests__/utils.test.ts
  - src/lib/__tests__/filters.test.ts
key_decisions:
  - Pharmaceuticals removed; Biotechnology remains as the actual binary-event-risk sector
patterns_established:
  - Constant array length assertions as regression guards for curated exclusion lists
observability_surfaces:
  - Test assertions: Pharmaceuticals→false, Integrated Oil→false, EXCLUDED_TICKERS length===28
duration: 8m
verification_result: passed
completed_at: 2026-03-16
blocker_discovered: false
---

# T01: Remove Pharmaceuticals exclusion, add E&P and ticker count test assertions

**Removed Pharmaceuticals from sector exclusion list; added E&P safety and ticker count test assertions.**

## What Happened

Three changes delivered in one pass:

1. **R038:** Deleted `'Pharmaceuticals'` from `EXCLUDED_INDUSTRIES` in `src/lib/constants.ts` — array dropped from 10 to 9 entries. Biotechnology remains as the actual binary-event-risk sector.

2. **R039:** Added test assertion proving `isExcludedSector('Integrated Oil & Gas', null)` returns `false` — the E&P exclusion (`'Oil & Gas Exploration & Production'`) uses `String.includes()` partial matching, but the strings don't overlap so integrated oil majors (XOM, CVX) are safe.

3. **R040:** Added `expect(EXCLUDED_TICKERS).toHaveLength(28)` assertion — locks down the ticker count as a regression guard.

Also added an integration test in `filters.test.ts` confirming a stock with `industry: 'Pharmaceuticals'` survives `filterStocks` when `excludeRiskySectors: true`.

## Verification

- `npx vitest run` — 236 tests pass (12 test files), including 2 new + 1 modified assertion
- `npx tsc --noEmit` — clean
- `npx eslint .` — 0 errors (1 pre-existing warning)
- `npx prettier --check .` — all files formatted
- `npm run build` — clean production build

## Diagnostics

- `npx vitest run --reporter=verbose` — grep for "Pharmaceuticals", "Integrated Oil", or "ticker count" to confirm all three regression assertions appear
- Test failures in `isExcludedSector` or `filterStocks` blocks indicate changes to exclusion arrays

## Deviations

None.

## Known Issues

None.

## Files Created/Modified

- `src/lib/constants.ts` — Removed `'Pharmaceuticals'` from `EXCLUDED_INDUSTRIES` (10→9 entries)
- `src/lib/__tests__/utils.test.ts` — Flipped Pharmaceuticals assertion to `false`, added E&P safety + ticker count assertions, imported `EXCLUDED_TICKERS`
- `src/lib/__tests__/filters.test.ts` — Added test: Pharmaceuticals stock survives `filterStocks` with `excludeRiskySectors: true`
