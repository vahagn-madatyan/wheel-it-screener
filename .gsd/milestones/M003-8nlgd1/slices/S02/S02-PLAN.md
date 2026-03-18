# S02: Sector exclusion refinement & ticker audit

**Goal:** Pharmaceuticals removed from sector exclusion list, E&P exclusion verified safe for integrated oil majors, excluded ticker count confirmed at 28 with no stale references.
**Demo:** `npx vitest run` shows Pharmaceuticals passing through `isExcludedSector`, `Integrated Oil & Gas` not caught by E&P exclusion, and `EXCLUDED_TICKERS.length === 28`.

## Must-Haves

- `'Pharmaceuticals'` removed from `EXCLUDED_INDUSTRIES` array in `src/lib/constants.ts`
- Existing test flipped: `isExcludedSector('Pharmaceuticals', null)` → `false`
- New test: `isExcludedSector('Integrated Oil & Gas', null)` → `false` (proves E&P doesn't over-match)
- New test: `EXCLUDED_TICKERS.length` === 28
- Integration test: stock with `industry: 'Pharmaceuticals'` survives `filterStocks` when `excludeRiskySectors: true`
- All existing tests still pass, build + lint + format clean

## Verification

- `npx vitest run` — all tests pass (updated assertions green, no regressions)
- `npx tsc --noEmit` — clean
- `npx eslint .` — clean
- `npx prettier --check .` — clean
- `npm run build` — clean

## Observability / Diagnostics

- **Test assertions as regression guards:** The new test assertions (Pharmaceuticals → false, Integrated Oil & Gas → false, EXCLUDED_TICKERS length === 28) serve as the primary failure surface. If someone re-adds Pharmaceuticals or changes the ticker list, vitest reports the exact assertion that broke.
- **Sector filter integration test:** The filters.test.ts Pharmaceuticals survival test catches regressions at the integration level — if the exclusion list or matching logic changes, this test surfaces it before it reaches production.
- **No runtime observability changes:** These are compile-time constants with no runtime logging. The existing `isExcludedSector` function has no side effects to instrument.

## Verification

- `npx vitest run` — all tests pass (updated assertions green, no regressions)
- `npx tsc --noEmit` — clean
- `npx eslint .` — clean
- `npx prettier --check .` — clean
- `npm run build` — clean
- **Diagnostic check:** `npx vitest run --reporter=verbose 2>&1 | grep -E 'Pharmaceuticals|Integrated Oil|EXCLUDED_TICKERS|ticker count'` — confirms all three new/modified assertions appear in test output

## Tasks

- [x] **T01: Remove Pharmaceuticals exclusion, add E&P and ticker count test assertions** `est:20m`
  - Why: Delivers all three slice requirements (R038, R039, R040) in one pass — all changes are in adjacent constants and shared test files
  - Files: `src/lib/constants.ts`, `src/lib/__tests__/utils.test.ts`, `src/lib/__tests__/filters.test.ts`
  - Do: (1) Remove `'Pharmaceuticals'` from `EXCLUDED_INDUSTRIES` array (~line 151 of constants.ts). (2) In utils.test.ts, flip the existing Pharmaceuticals assertion from `toBe(true)` to `toBe(false)` (~line 56). (3) Add assertion that `isExcludedSector('Integrated Oil & Gas', null)` returns `false`. (4) Add assertion that `EXCLUDED_TICKERS.length` equals 28. (5) In filters.test.ts, add a test that a stock with `industry: 'Pharmaceuticals'` survives `filterStocks` when `excludeRiskySectors: true`. (6) Run full verification: vitest, tsc, eslint, prettier, build.
  - Verify: `npx vitest run && npx tsc --noEmit && npx eslint . && npx prettier --check . && npm run build`
  - Done when: All tests pass including new assertions, zero lint/type/format errors, clean build

## Files Likely Touched

- `src/lib/constants.ts`
- `src/lib/__tests__/utils.test.ts`
- `src/lib/__tests__/filters.test.ts`
