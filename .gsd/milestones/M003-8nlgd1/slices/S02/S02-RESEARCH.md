# S02: Sector exclusion refinement & ticker audit — Research

**Date:** 2026-03-16
**Depth:** Light — constant array edits and test updates in known files.

## Summary

This slice has three changes: (1) remove `'Pharmaceuticals'` from `EXCLUDED_INDUSTRIES`, (2) add a test proving E&P label doesn't match integrated oil majors, (3) confirm EXCLUDED_TICKERS count is 28 with no stale references.

All three are straightforward. The `isExcludedSector` function uses partial matching (`ind.includes(ex.toLowerCase())`), so removing Pharmaceuticals has zero risk of breaking other exclusions. The E&P vs. Integrated Oil concern is already safe — `"integrated oil & gas"` does not contain `"oil & gas exploration & production"` — but a test should prove it. No UI, tooltip, or code reference to "30 excluded tickers" exists; the count is already accurate at 28. No stale references to fix.

## Recommendation

Single task — all three changes are in adjacent code and share the same test file. Edit `constants.ts` (one line removal), add 2-3 test assertions in `utils.test.ts` (Pharmaceuticals now passes, E&P doesn't match integrated oil, ticker count is 28), and optionally add one assertion in `filters.test.ts` to cover the integration path. Verify with full test suite + lint + build.

## Implementation Landscape

### Key Files

- `src/lib/constants.ts:149-161` — `EXCLUDED_INDUSTRIES` array. Remove `'Pharmaceuticals'` from line 151. Array currently has 10 entries, will have 9 after.
- `src/lib/utils.ts:28-37` — `isExcludedSector()` function. No changes needed — logic is correct, only the constant data changes.
- `src/lib/__tests__/utils.test.ts:45-88` — `isExcludedSector` test block. Changes needed:
  - Line 56: `expect(isExcludedSector('Pharmaceuticals', null)).toBe(true)` → flip to `false`
  - Add assertion: `isExcludedSector('Integrated Oil & Gas', null)` → `false` (proves E&P exclusion doesn't over-match)
  - Add assertion: `EXCLUDED_TICKERS.length` → `28`
- `src/lib/__tests__/filters.test.ts:185-210` — `filterStocks` sector exclusion tests. Consider adding a test that a stock with `industry: 'Pharmaceuticals'` survives when `excludeRiskySectors: true`.

### Build Order

Single unit of work — all changes are leaf-node constants and tests with no downstream dependencies.

1. Edit `EXCLUDED_INDUSTRIES` in `constants.ts` (remove Pharmaceuticals)
2. Update and add test assertions in `utils.test.ts`
3. Optionally add integration-level test in `filters.test.ts`
4. Verify

### Verification Approach

- `npx vitest run` — all 227+ tests pass (updated assertions green, no regressions)
- `npx tsc --noEmit` — type-checks clean
- `npx eslint .` — no lint errors
- `npx prettier --check .` — no formatting issues
- `npm run build` — clean production build

## Constraints

- `isExcludedSector` uses **partial matching** via `String.includes()`. Removing an entry is safe (reduces matches). Adding entries requires care to avoid substring collisions — but this slice only removes.
- The Pharmaceuticals assertion on line 56 of `utils.test.ts` must be updated, not deleted — it becomes a negative assertion proving Pharmaceuticals now passes through.
