# S01: Preset value corrections

**Goal:** All 3 filter presets (`finviz_cut2`, `conservative`, `aggressive`) have corrected numeric values matching the Issue-Fix.csv audit findings.
**Demo:** New explicit-value test assertions pass for all 6 corrected fields. Full test suite green, build clean.

## Must-Haves

- `finviz_cut2.maxPrice` changed from 50 → 150 (R033)
- `conservative.maxPrice` changed from 100 → 150 (R033)
- `conservative.maxBP` changed from 15000 → 10000 (R034)
- `conservative.maxDebtEquity` changed from 0.5 → 1.0 (R035)
- `aggressive.minNetMargin` changed from -50 → -10 (R036)
- `conservative.minIVRank` changed from 20 → 25 (R037)
- Explicit-value test assertions (not tautological comparisons against PRESETS object)

## Verification

- `npx vitest run` — all tests pass including new explicit preset value assertions
- `npx tsc --noEmit` — no type errors
- `npx eslint .` — no lint errors
- `npx prettier --check .` — formatting clean

## Tasks

- [x] **T01: Correct preset values and add explicit-value test assertions** `est:20m`
  - Why: All 6 preset value corrections and their proof live in two files — no reason to split
  - Files: `src/lib/constants.ts`, `src/stores/__tests__/stores.test.ts`
  - Do: Change 6 numeric values in `PRESETS` record (lines 202–289 of constants.ts). Add a new `describe('preset audit values')` block in stores.test.ts with explicit numeric assertions for each corrected field — assert against literal numbers, not against the PRESETS object (existing tests already do that and are tautological).
  - Verify: `npx vitest run && npx tsc --noEmit && npx eslint . && npx prettier --check .`
  - Done when: All 4 verification commands exit 0, new test block has 6+ assertions with literal expected values

## Observability / Diagnostics

- **Runtime signals:** None — preset values are static constants, not runtime state.
- **Inspection surface:** `npx vitest run --reporter=verbose` shows explicit literal-value assertions in the `preset audit values (R033–R037)` block. Any future drift will fail these tests.
- **Failure visibility:** A wrong preset value surfaces as a test failure with the expected literal vs. actual value — immediately diagnosable without reading source.
- **Redaction constraints:** None — no secrets or PII in preset numeric values.

## Files Likely Touched

- `src/lib/constants.ts`
- `src/stores/__tests__/stores.test.ts`
