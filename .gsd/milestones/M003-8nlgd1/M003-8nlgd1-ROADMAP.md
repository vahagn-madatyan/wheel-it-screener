# M003-8nlgd1: Filter Preset Tuning & Sector Exclusion Audit

**Vision:** Correct all filter preset values and sector exclusion lists based on a systematic audit. After this milestone, presets produce results calibrated to how options traders actually use the wheel strategy — blue-chip stocks survive, banks aren't blanket-excluded, and only genuine binary-risk sectors are filtered.

## Success Criteria

- Running a scan with Finviz Cut 2 preset includes stocks priced up to $150 (not capped at $50)
- Conservative preset allows banks (D/E up to 1.0) and has tighter buying power ($10K)
- Aggressive preset rejects companies with net margin below -10% (not -50%)
- Pharmaceuticals stocks (JNJ, PFE, ABBV) survive sector exclusion; Biotechnology stocks do not
- EXCLUDED_TICKERS count matches actual array length (28)
- All tests pass, build succeeds

## Key Risks / Unknowns

- None significant — all changes are constant values and a single array entry removal

## Verification Classes

- Contract verification: Vitest tests — preset value assertions, sector exclusion tests, ticker count test
- Integration verification: `npm run build` clean, `npx eslint .` + `npx prettier --check .` pass
- Operational verification: none
- UAT / human verification: optional browser scan to confirm preset behavior

## Milestone Definition of Done

This milestone is complete only when all are true:

- All preset values corrected per Issue-Fix.csv audit
- Pharmaceuticals removed from EXCLUDED_INDUSTRIES
- Excluded ticker count verified accurate
- All Vitest tests pass (227+ existing + any new)
- `tsc --noEmit`, `eslint .`, `prettier --check .` all exit 0
- `npm run build` succeeds

## Requirement Coverage

- Covers: R033, R034, R035, R036, R037, R038, R039, R040
- Partially covers: none
- Leaves for later: none
- Orphan risks: none

## Slices

- [ ] **S01: Preset value corrections** `risk:low` `depends:[]`
  > After this: All 3 presets have corrected values — Finviz Cut 2 maxPrice $150, Conservative maxBP $10K / D/E 1.0 / IV rank 25, Aggressive minNetMargin -10%. Verified by updated preset tests and tsc clean.

- [ ] **S02: Sector exclusion refinement & ticker audit** `risk:low` `depends:[]`
  > After this: Pharmaceuticals removed from exclusion list, E&P label verified for integrated oil majors, excluded ticker count confirmed as 28 with any stale "30" references fixed. Tests updated.

## Boundary Map

### S01

Produces:
- Updated `PRESETS` record in `src/lib/constants.ts` with corrected values for all 3 presets
- Updated `getDefaultFilterState()` in `src/stores/filter-store.ts` if defaults derive from preset

Consumes:
- nothing (leaf node — constant changes only)

### S02

Produces:
- Updated `EXCLUDED_INDUSTRIES` array in `src/lib/constants.ts` (Pharmaceuticals removed)
- Verified `EXCLUDED_TICKERS` count (28) with any stale count references fixed
- Test assertion confirming E&P label doesn't match integrated oil majors

Consumes:
- nothing (independent of S01 — both touch constants.ts but different sections)
