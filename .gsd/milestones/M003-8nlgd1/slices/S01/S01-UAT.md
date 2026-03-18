# S01: Preset value corrections — UAT

**Milestone:** M003-8nlgd1
**Written:** 2026-03-16

## UAT Type

- UAT mode: artifact-driven
- Why this mode is sufficient: All changes are static numeric constants verified by literal-value test assertions. No runtime behavior, API calls, or UI state transitions to validate beyond what tests cover.

## Preconditions

- Node.js installed, `npm install` completed
- Repository at the S01-completed commit

## Smoke Test

Run `npx vitest run --reporter=verbose 2>&1 | grep "preset audit"` — all 6 assertions in the `preset audit values (R033–R037)` block should show green checkmarks.

## Test Cases

### 1. Finviz Cut 2 maxPrice is 150 (R033)

1. Open `src/lib/constants.ts`
2. Find `PRESETS.finviz_cut2.maxPrice`
3. **Expected:** Value is `150` (not the old `50`)

### 2. Conservative maxPrice is 150 (R033)

1. Open `src/lib/constants.ts`
2. Find `PRESETS.conservative.maxPrice`
3. **Expected:** Value is `150` (not the old `100`)

### 3. Conservative maxBP is 10000 (R034)

1. Open `src/lib/constants.ts`
2. Find `PRESETS.conservative.maxBP`
3. **Expected:** Value is `10000` (not the old `15000`)

### 4. Conservative maxDebtEquity is 1.0 (R035)

1. Open `src/lib/constants.ts`
2. Find `PRESETS.conservative.maxDebtEquity`
3. **Expected:** Value is `1.0` (not the old `0.5`)

### 5. Conservative minIVRank is 25 (R037)

1. Open `src/lib/constants.ts`
2. Find `PRESETS.conservative.minIVRank`
3. **Expected:** Value is `25` (not the old `20`)

### 6. Aggressive minNetMargin is -10 (R036)

1. Open `src/lib/constants.ts`
2. Find `PRESETS.aggressive.minNetMargin`
3. **Expected:** Value is `-10` (not the old `-50`)

### 7. Test assertions use literal values, not PRESETS references

1. Open `src/stores/__tests__/stores.test.ts`
2. Find the `describe('preset audit values (R033–R037)')` block
3. **Expected:** Each `expect()` call compares `PRESETS.<preset>.<field>` against a hardcoded number (e.g., `toBe(150)`), NOT against another PRESETS property

### 8. Full test suite passes

1. Run `npx vitest run`
2. **Expected:** 233 tests pass across 12 files, 0 failures

### 9. Build and lint clean

1. Run `npx tsc --noEmit && npx eslint . && npx prettier --check .`
2. **Expected:** All three exit 0 (ESLint may show 1 pre-existing warning in ScoringWeightsSection.tsx — that's acceptable)

## Edge Cases

### Aggressive maxPrice unchanged

1. Open `src/lib/constants.ts`
2. Find `PRESETS.aggressive.maxPrice`
3. **Expected:** Value is `200` — unchanged from before. Only finviz_cut2 and conservative maxPrice were corrected.

### Default filter state reflects Finviz Cut 2

1. Check `getDefaultFilterState()` in `src/stores/filter-store.ts`
2. **Expected:** Default maxPrice is `150` (matches Finviz Cut 2 preset). If defaults derive from the PRESETS object, this is automatic. If hardcoded separately, they should match.

## Failure Signals

- Any test in `preset audit values (R033–R037)` failing with `expected X, received Y` means a preset value has drifted
- `tsc --noEmit` errors in constants.ts would indicate a type-level issue with the changed values
- If the filter sidebar defaults don't match Finviz Cut 2 after the change, `getDefaultFilterState()` may have stale hardcoded values

## Requirements Proved By This UAT

- R033 — maxPrice raised to 150 for finviz_cut2 and conservative
- R034 — conservative maxBP lowered to 10000
- R035 — conservative maxDebtEquity raised to 1.0
- R036 — aggressive minNetMargin tightened to -10
- R037 — conservative minIVRank raised to 25

## Not Proven By This UAT

- Runtime scan behavior with corrected values (would require live API keys and a full scan)
- UI sidebar showing updated default values (would require browser verification)
- Interaction between corrected preset values and actual stock filtering results

## Notes for Tester

All changes are numeric constants — this is a low-risk slice. The test assertions are the primary proof. A quick visual check of the sidebar defaults in the browser is a nice-to-have but not required since the store derives defaults from the PRESETS object.
