---
estimated_steps: 4
estimated_files: 2
---

# T01: Correct preset values and add explicit-value test assertions

**Slice:** S01 — Preset value corrections
**Milestone:** M003-8nlgd1

## Description

Six numeric constants in `PRESETS` are wrong per the Issue-Fix.csv audit. Change them, then add test assertions that pin the correct values using literal numbers (not self-referencing the PRESETS object).

The existing test suite (`stores.test.ts` lines 57–160) tests preset-to-filter-state mapping, but those assertions compare `state.maxPrice` against `preset.maxPrice` — tautological. They'd pass regardless of the actual value. New assertions must use literal numbers to catch regressions.

## Steps

1. Open `src/lib/constants.ts` and locate the `PRESETS` record (lines 202–289). Make these 6 changes:

   | Preset | Field | Current → Target |
   |--------|-------|-----------------|
   | `finviz_cut2` | `maxPrice` | 50 → 150 |
   | `conservative` | `maxPrice` | 100 → 150 |
   | `conservative` | `maxBP` | 15000 → 10000 |
   | `conservative` | `maxDebtEquity` | 0.5 → 1.0 |
   | `conservative` | `minIVRank` | 20 → 25 |
   | `aggressive` | `minNetMargin` | -50 → -10 |

2. Open `src/stores/__tests__/stores.test.ts`. Add a new `describe('preset audit values (R033–R037)')` block after the existing preset tests. Import `PRESETS` from `@/lib/constants` (likely already imported). Write assertions using **literal expected values**:
   ```ts
   expect(PRESETS.finviz_cut2.maxPrice).toBe(150);
   expect(PRESETS.conservative.maxPrice).toBe(150);
   expect(PRESETS.conservative.maxBP).toBe(10000);
   expect(PRESETS.conservative.maxDebtEquity).toBe(1.0);
   expect(PRESETS.conservative.minIVRank).toBe(25);
   expect(PRESETS.aggressive.minNetMargin).toBe(-10);
   ```

3. Run `npx tsc --noEmit` to confirm type safety (all values are `number`, low risk).

4. Run `npx vitest run` to confirm all 227+ existing tests still pass and new assertions pass.

5. Run `npx eslint .` and `npx prettier --check .` to confirm lint/format clean.

## Must-Haves

- [ ] All 6 values changed to their target numbers
- [ ] New test block uses literal expected values, not references to PRESETS
- [ ] All existing tests still pass (no regressions)
- [ ] `tsc --noEmit`, `vitest run`, `eslint .`, `prettier --check .` all exit 0

## Verification

- `npx vitest run` — all tests pass including new `preset audit values` describe block
- `npx tsc --noEmit` — clean
- `npx eslint .` — clean
- `npx prettier --check .` — clean

## Observability Impact

- **Signals changed:** None — no runtime logging, metrics, or error reporting affected. Pure constant-value corrections.
- **Inspection:** Run `npx vitest run` and look for the `preset audit values (R033–R037)` describe block. Each assertion pins a literal expected value, so future drift produces a clear mismatch message.
- **Failure state:** Test failure output shows `expected X, received Y` for the specific preset field — no additional diagnostic tooling needed.

## Inputs

- `src/lib/constants.ts` — contains `PRESETS` record with current (incorrect) values
- `src/stores/__tests__/stores.test.ts` — existing preset test suite to extend

## Expected Output

- `src/lib/constants.ts` — 6 numeric values corrected in-place within `PRESETS`
- `src/stores/__tests__/stores.test.ts` — new `describe('preset audit values (R033–R037)')` block with 6 literal-value assertions
