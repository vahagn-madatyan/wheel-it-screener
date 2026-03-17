---
sliceId: S01
uatType: artifact-driven
verdict: PASS
date: 2026-03-17T02:52:00Z
---

# UAT Result — S01

## Checks

| Check | Result | Notes |
|-------|--------|-------|
| 1. finviz_cut2.maxPrice is 150 (R033) | PASS | constants.ts line 206: `maxPrice: 150` |
| 2. conservative.maxPrice is 150 (R033) | PASS | constants.ts line 233: `maxPrice: 150` |
| 3. conservative.maxBP is 10000 (R034) | PASS | constants.ts line 243: `maxBP: 10000` |
| 4. conservative.maxDebtEquity is 1.0 (R035) | PASS | constants.ts line 238: `maxDebtEquity: 1.0` |
| 5. conservative.minIVRank is 25 (R037) | PASS | constants.ts line 246: `minIVRank: 25` |
| 6. aggressive.minNetMargin is -10 (R036) | PASS | constants.ts line 266: `minNetMargin: -10` |
| 7. Test assertions use literal values | PASS | All 6 assertions in `preset audit values (R033–R037)` block use `toBe(<number>)` with hardcoded literals |
| 8. Full test suite passes | PASS | 233 tests pass across 12 files, 0 failures |
| 9. Build and lint clean | PASS | `tsc --noEmit` clean, ESLint 0 errors (1 pre-existing warning in ScoringWeightsSection.tsx), Prettier all formatted |
| Edge: aggressive.maxPrice unchanged | PASS | constants.ts line 260: `maxPrice: 200` — unchanged |
| Edge: Default filter state reflects Finviz Cut 2 | PASS | `DEFAULT_PRESET = PRESETS.finviz_cut2` in filter-store.ts; defaults derive from PRESETS object, so maxPrice=150 flows through automatically |

## Overall Verdict

PASS — All 9 test cases and 2 edge cases verified. Preset values match requirements R033–R037, test assertions use literal values, full suite passes (233/233), and build/lint are clean.

## Notes

- The pre-existing ESLint warning `react-refresh/only-export-components` in ScoringWeightsSection.tsx is unrelated to this slice.
- Default filter state automatically inherits corrected values via `presetToFilterState(PRESETS.finviz_cut2)` — no hardcoded defaults to drift.
