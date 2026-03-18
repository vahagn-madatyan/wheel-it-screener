# S01: Preset value corrections — Research

**Date:** 2026-03-16
**Depth:** Light

## Summary

This slice corrects 6 constant values across 3 presets in a single file (`src/lib/constants.ts`). The changes are pure number edits — no logic, no type changes, no new fields. The filter store derives defaults from `PRESETS.finviz_cut2` via `presetToFilterState()`, so changing the constant flows through automatically.

The existing test suite (stores.test.ts) compares filter state against the PRESETS object dynamically (e.g. `expect(state.maxPrice).toBe(preset.maxPrice)`), which means those assertions are tautological — they'll pass regardless of the actual value. New explicit-value assertions are needed to prove R033–R037 were applied correctly.

## Recommendation

Single task. Change 6 values in `PRESETS` within `src/lib/constants.ts`, then add one new test block in `src/stores/__tests__/stores.test.ts` with explicit numeric assertions for all changed fields. Verify with `tsc --noEmit` + full test suite.

## Implementation Landscape

### Key Files

- `src/lib/constants.ts` (lines 202–289) — `PRESETS` record with all 3 preset definitions. This is the only file that needs value changes.
- `src/stores/filter-store.ts` — Derives defaults from `PRESETS.finviz_cut2` via `presetToFilterState()`. No changes needed — constant changes propagate automatically.
- `src/stores/__tests__/stores.test.ts` (lines 57–160) — Existing preset tests. Need new explicit-value assertions.

### Exact Changes

| Preset | Field | Current | Target | Requirement |
|--------|-------|---------|--------|-------------|
| `finviz_cut2` | `maxPrice` | 50 | 150 | R033 |
| `conservative` | `maxPrice` | 100 | 150 | R033 |
| `conservative` | `maxBP` | 15000 | 10000 | R034 |
| `conservative` | `maxDebtEquity` | 0.5 | 1.0 | R035 |
| `conservative` | `minIVRank` | 20 | 25 | R037 |
| `aggressive` | `minNetMargin` | -50 | -10 | R036 |

### Build Order

1. Change constants in `src/lib/constants.ts`
2. Add explicit-value test assertions in `src/stores/__tests__/stores.test.ts`
3. Verify: `npx tsc --noEmit`, `npx vitest run`, `npx eslint .`, `npx prettier --check .`

### Verification Approach

- `npx tsc --noEmit` — type safety (values are all `number`, no risk, but confirm clean)
- `npx vitest run` — all 227+ tests pass, including new explicit assertions
- `npx eslint .` + `npx prettier --check .` — lint/format clean
- New test assertions should check exact values, not compare against the PRESETS object:
  - `expect(PRESETS.finviz_cut2.maxPrice).toBe(150)`
  - `expect(PRESETS.conservative.maxBP).toBe(10000)`
  - etc.
