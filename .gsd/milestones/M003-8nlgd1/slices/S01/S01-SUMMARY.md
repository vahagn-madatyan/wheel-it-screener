---
id: S01
parent: M003-8nlgd1
milestone: M003-8nlgd1
provides:
  - Corrected 6 preset numeric values across 3 presets per Issue-Fix.csv audit (R033–R037)
  - 6 literal-value test assertions pinning each corrected value against regression
requires: []
affects:
  - S02
key_files:
  - src/lib/constants.ts
  - src/stores/__tests__/stores.test.ts
key_decisions:
  - Preset value assertions use literal numbers, never self-referencing the PRESETS object
patterns_established:
  - Audit-style test blocks with requirement IDs in test names for traceability
observability_surfaces:
  - "vitest: `preset audit values (R033–R037)` describe block — 6 assertions with literal expected values"
drill_down_paths:
  - .gsd/milestones/M003-8nlgd1/slices/S01/tasks/T01-SUMMARY.md
duration: 10m
verification_result: passed
completed_at: 2026-03-16
---

# S01: Preset value corrections

**Corrected 6 numeric preset values (finviz_cut2 maxPrice, conservative maxPrice/maxBP/maxDebtEquity/minIVRank, aggressive minNetMargin) and pinned each with literal-value test assertions.**

## What Happened

Single task (T01) changed 6 values in the `PRESETS` record in `constants.ts` and added a `describe('preset audit values (R033–R037)')` block in `stores.test.ts` with one `it` per correction. Each assertion compares against a literal number — not against the `PRESETS` object — so the tests catch actual drift rather than tautologically passing.

Changes:
- `finviz_cut2.maxPrice`: 50 → 150 (R033)
- `conservative.maxPrice`: 100 → 150 (R033)
- `conservative.maxBP`: 15000 → 10000 (R034)
- `conservative.maxDebtEquity`: 0.5 → 1.0 (R035)
- `conservative.minIVRank`: 20 → 25 (R037)
- `aggressive.minNetMargin`: -50 → -10 (R036)

Pre-existing prettier issues in `README.md` and `src/lib/filters.ts` were also fixed (not introduced by this slice).

## Verification

- `npx vitest run` — 233 tests pass (12 files), including 6 new preset audit assertions
- `npx tsc --noEmit` — clean
- `npx eslint .` — 0 errors (1 pre-existing warning in ScoringWeightsSection.tsx)
- `npx prettier --check .` — clean (after fixing 2 pre-existing formatting issues)

## Requirements Advanced

- none (all moved directly to validated)

## Requirements Validated

- R033 — finviz_cut2.maxPrice=150 and conservative.maxPrice=150 asserted with literal-value tests
- R034 — conservative.maxBP=10000 asserted with literal-value test
- R035 — conservative.maxDebtEquity=1.0 asserted with literal-value test
- R036 — aggressive.minNetMargin=-10 asserted with literal-value test
- R037 — conservative.minIVRank=25 asserted with literal-value test

## New Requirements Surfaced

- none

## Requirements Invalidated or Re-scoped

- none

## Deviations

None. All 6 corrections matched the plan exactly.

## Known Limitations

- The pre-existing ESLint warning in ScoringWeightsSection.tsx (react-refresh/only-export-components) persists — unrelated to this slice.

## Follow-ups

- none

## Files Created/Modified

- `src/lib/constants.ts` — 6 numeric values corrected in PRESETS record
- `src/stores/__tests__/stores.test.ts` — added `describe('preset audit values (R033–R037)')` block with 6 literal-value assertions
- `README.md` — pre-existing prettier formatting fixed
- `src/lib/filters.ts` — pre-existing prettier formatting fixed

## Forward Intelligence

### What the next slice should know
- S01 and S02 touch different sections of `constants.ts` — S01 modified `PRESETS` (lines ~200–290), S02 will modify `EXCLUDED_INDUSTRIES` and `EXCLUDED_TICKERS` (different sections). No merge conflicts expected.

### What's fragile
- Nothing introduced by this slice is fragile. Preset values are static constants with pinned test assertions.

### Authoritative diagnostics
- `npx vitest run --reporter=verbose | grep "preset audit"` — shows all 6 literal-value assertions with requirement IDs. Any drift produces an immediate `expected X, received Y` failure.

### What assumptions changed
- No assumptions changed — all 6 corrections were straightforward constant-value edits as planned.
