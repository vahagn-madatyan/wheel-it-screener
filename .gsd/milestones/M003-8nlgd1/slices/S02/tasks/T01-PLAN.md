---
estimated_steps: 6
estimated_files: 3
---

# T01: Remove Pharmaceuticals exclusion, add E&P and ticker count test assertions

**Slice:** S02 — Sector exclusion refinement & ticker audit
**Milestone:** M003-8nlgd1

## Description

Three related changes to sector exclusion constants and their tests:

1. **R038 — Remove Pharmaceuticals exclusion:** Delete `'Pharmaceuticals'` from the `EXCLUDED_INDUSTRIES` array in `src/lib/constants.ts`. This allows big pharma stocks (JNJ, PFE, ABBV) to pass through the sector filter. The array drops from 10 entries to 9. `'Biotechnology'` remains, which is the actual binary-event-risk sector.

2. **R039 — Verify E&P doesn't catch integrated oil majors:** The `isExcludedSector` function uses partial matching via `String.includes()`. The excluded industry `'Oil & Gas Exploration & Production'` must NOT match `'Integrated Oil & Gas'`. This is already true (`"integrated oil & gas".includes("oil & gas exploration & production")` → false), but add a test assertion to prove it and prevent regressions.

3. **R040 — Confirm ticker count:** `EXCLUDED_TICKERS` has 28 entries. Add a test assertion for `EXCLUDED_TICKERS.length === 28`. No stale references to "30" exist in the codebase (research confirmed), so no docs/UI changes needed.

## Steps

1. Open `src/lib/constants.ts` and remove `'Pharmaceuticals'` from the `EXCLUDED_INDUSTRIES` array (around line 151). The array should go from 10 entries to 9. Do not change any other entries.

2. Open `src/lib/__tests__/utils.test.ts`. In the `isExcludedSector` test block (~line 56), find the assertion `expect(isExcludedSector('Pharmaceuticals', null)).toBe(true)` and change it to `.toBe(false)`.

3. In the same test file, add two new assertions to the `isExcludedSector` describe block:
   - `expect(isExcludedSector('Integrated Oil & Gas', null)).toBe(false)` — proves E&P exclusion doesn't over-match integrated oil majors
   - Import `EXCLUDED_TICKERS` from `../constants` (if not already imported) and assert `expect(EXCLUDED_TICKERS).toHaveLength(28)`

4. Open `src/lib/__tests__/filters.test.ts`. In the sector exclusion test block (~lines 185-210), add a test case that creates a stock with `industry: 'Pharmaceuticals'` and confirms it survives `filterStocks` when `excludeRiskySectors: true`. Follow the existing test pattern for stock fixtures in that file.

5. Run `npx vitest run` — all tests pass including the updated/new assertions.

6. Run full verification: `npx tsc --noEmit && npx eslint . && npx prettier --check . && npm run build`

## Must-Haves

- [ ] `'Pharmaceuticals'` removed from `EXCLUDED_INDUSTRIES` in constants.ts
- [ ] Existing Pharmaceuticals test flipped to `toBe(false)` in utils.test.ts
- [ ] New assertion: `isExcludedSector('Integrated Oil & Gas', null)` → `false`
- [ ] New assertion: `EXCLUDED_TICKERS.length` === 28
- [ ] New integration test: Pharmaceuticals stock survives `filterStocks` with `excludeRiskySectors: true`
- [ ] All tests pass, tsc clean, eslint clean, prettier clean, build clean

## Verification

- `npx vitest run` — all tests pass, no regressions
- `npx tsc --noEmit && npx eslint . && npx prettier --check . && npm run build` — all clean

## Inputs

- `src/lib/constants.ts` — contains `EXCLUDED_INDUSTRIES` (~line 149-161) and `EXCLUDED_TICKERS` arrays
- `src/lib/utils.ts` — contains `isExcludedSector()` function (no changes needed, logic is correct)
- `src/lib/__tests__/utils.test.ts` — existing `isExcludedSector` test block (~line 45-88)
- `src/lib/__tests__/filters.test.ts` — existing `filterStocks` sector exclusion tests (~line 185-210)

## Expected Output

- `src/lib/constants.ts` — `EXCLUDED_INDUSTRIES` has 9 entries (Pharmaceuticals removed)
- `src/lib/__tests__/utils.test.ts` — Pharmaceuticals assertion flipped, 2 new assertions added (E&P safety, ticker count)
- `src/lib/__tests__/filters.test.ts` — 1 new test case for Pharmaceuticals surviving sector filter

## Observability Impact

- **What changes:** Three test assertions added/modified — these are the durable regression signals for R038/R039/R040.
- **How to inspect:** `npx vitest run --reporter=verbose` shows each assertion by name. Grep for "Pharmaceuticals", "Integrated Oil", or "ticker count" to confirm coverage.
- **Failure visibility:** If `EXCLUDED_INDUSTRIES` or `EXCLUDED_TICKERS` arrays are modified incorrectly in the future, the length assertion and industry-specific assertions fail with clear expected-vs-actual output.
