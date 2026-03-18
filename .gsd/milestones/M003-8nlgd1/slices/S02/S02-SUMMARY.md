---
id: S02
parent: M003-8nlgd1
milestone: M003-8nlgd1
provides:
  - Pharmaceuticals removed from EXCLUDED_INDUSTRIES (R038)
  - E&P exclusion safety proven — Integrated Oil & Gas doesn't partial-match (R039)
  - EXCLUDED_TICKERS count locked at 28 via test assertion (R040)
requires: []
affects: []
key_files:
  - src/lib/constants.ts
  - src/lib/__tests__/utils.test.ts
  - src/lib/__tests__/filters.test.ts
key_decisions:
  - Pharmaceuticals removed; Biotechnology remains as the actual binary-event-risk sector
patterns_established:
  - Constant array length assertions as regression guards for curated exclusion lists
observability_surfaces:
  - "vitest: Pharmaceuticals→false, Integrated Oil→false, EXCLUDED_TICKERS length===28 assertions"
drill_down_paths:
  - .gsd/milestones/M003-8nlgd1/slices/S02/tasks/T01-SUMMARY.md
duration: 8m
verification_result: passed
completed_at: 2026-03-16
---

# S02: Sector exclusion refinement & ticker audit

**Removed Pharmaceuticals from sector exclusion, verified E&P label safety for integrated oil majors, and locked EXCLUDED_TICKERS count at 28 with a regression test.**

## What Happened

Single task (T01) made three targeted changes:

1. **R038:** Deleted `'Pharmaceuticals'` from `EXCLUDED_INDUSTRIES` in `constants.ts` — array dropped from 10 to 9 entries. Biotechnology remains as the actual binary-event-risk sector. Added integration test confirming a Pharmaceuticals stock survives `filterStocks` with `excludeRiskySectors: true`.

2. **R039:** Added test assertion proving `isExcludedSector('Integrated Oil & Gas', null)` returns `false` — the E&P exclusion string (`'Oil & Gas Exploration & Production'`) uses `String.includes()` partial matching, but the strings don't overlap, so integrated oil majors (XOM, CVX) are safe.

3. **R040:** Added `expect(EXCLUDED_TICKERS).toHaveLength(28)` assertion in `utils.test.ts` — locks down the ticker count as a regression guard. No stale "30" references found anywhere in `src/` or `README.md`.

## Verification

- `npx vitest run` — 236 tests pass (12 test files), including 2 new + 1 modified assertion
- `npx tsc --noEmit` — clean
- `npx eslint .` — 0 errors (1 pre-existing warning)
- `npx prettier --check .` — all files formatted
- `npm run build` — clean production build

## Requirements Validated

- R038 — Pharmaceuticals removed from EXCLUDED_INDUSTRIES; integration test confirms survival
- R039 — isExcludedSector('Integrated Oil & Gas', null) asserted false
- R040 — EXCLUDED_TICKERS.toHaveLength(28) assertion; no stale count references

## Deviations

None.

## Known Limitations

- Pre-existing ESLint warning in ScoringWeightsSection.tsx persists — unrelated to this slice.

## Follow-ups

- none

## Files Created/Modified

- `src/lib/constants.ts` — Removed `'Pharmaceuticals'` from EXCLUDED_INDUSTRIES (10→9 entries)
- `src/lib/__tests__/utils.test.ts` — Flipped Pharmaceuticals assertion to false, added E&P safety + ticker count assertions
- `src/lib/__tests__/filters.test.ts` — Added Pharmaceuticals-survives-filter integration test

## Forward Intelligence

### What the next slice should know
- S02 modified EXCLUDED_INDUSTRIES (different section from S01's PRESETS changes in constants.ts) — no conflicts.

### What's fragile
- Nothing. Exclusion list is static with pinned test assertions.

### Authoritative diagnostics
- `npx vitest run --reporter=verbose | grep -i "pharmaceut\|integrated\|ticker count"` — shows all 3 regression assertions.

### What assumptions changed
- None — all changes matched the plan exactly.
