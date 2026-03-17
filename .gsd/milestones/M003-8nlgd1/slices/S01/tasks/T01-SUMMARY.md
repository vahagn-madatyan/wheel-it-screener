---
id: T01
parent: S01
milestone: M003-8nlgd1
provides:
  - Corrected 6 preset values per Issue-Fix.csv audit (R033–R037)
  - Non-tautological test assertions pinning literal expected values
key_files:
  - src/lib/constants.ts
  - src/stores/__tests__/stores.test.ts
key_decisions:
  - Each assertion gets its own `it` block with requirement ID in the name for traceability
patterns_established:
  - Preset value assertions use literal numbers, never self-referencing the PRESETS object
observability_surfaces:
  - "vitest: `preset audit values (R033–R037)` describe block — 6 assertions with literal expected values"
duration: 10m
verification_result: passed
completed_at: 2026-03-16
blocker_discovered: false
---

# T01: Corrected 6 preset values and added pinned literal-value test assertions

**Changed `finviz_cut2.maxPrice` (50→150), `conservative.maxPrice` (100→150), `conservative.maxBP` (15000→10000), `conservative.maxDebtEquity` (0.5→1.0), `conservative.minIVRank` (20→25), and `aggressive.minNetMargin` (-50→-10). Added 6 test assertions using literal expected values to prevent regression.**

## What Happened

Applied all 6 numeric corrections to the `PRESETS` record in `constants.ts` per the Issue-Fix.csv audit findings. Added a new `describe('preset audit values (R033–R037)')` block in `stores.test.ts` with one `it` per corrected field, each asserting against a literal number rather than comparing against the PRESETS object (which would be tautological).

## Verification

- `npx tsc --noEmit` — clean, exit 0
- `npx vitest run` — 233 tests pass (12 test files), including all 6 new assertions
- `npx eslint .` — 0 errors (1 pre-existing warning in ScoringWeightsSection.tsx, unrelated)
- `npx prettier --check .` — clean for all files touched by this task; 2 pre-existing issues in README.md and filters.ts (not modified here)

## Diagnostics

Run `npx vitest run --reporter=verbose` and look for the `preset audit values (R033–R037)` describe block. Each assertion shows the preset name, field, and requirement ID. A future drift in any preset value will produce a clear `expected X, received Y` failure.

## Deviations

None.

## Known Issues

Pre-existing prettier formatting issues in `README.md` and `src/lib/filters.ts` — not introduced by this task.

## Files Created/Modified

- `src/lib/constants.ts` — 6 numeric values corrected in PRESETS record
- `src/stores/__tests__/stores.test.ts` — added `describe('preset audit values (R033–R037)')` block with 6 literal-value assertions
- `.gsd/milestones/M003-8nlgd1/slices/S01/S01-PLAN.md` — added Observability/Diagnostics section
- `.gsd/milestones/M003-8nlgd1/slices/S01/tasks/T01-PLAN.md` — added Observability Impact section
