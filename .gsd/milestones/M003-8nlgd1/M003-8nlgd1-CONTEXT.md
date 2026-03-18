# M003-8nlgd1: Filter Preset Tuning & Sector Exclusion Audit — Context

**Gathered:** 2026-03-16
**Status:** Ready for planning

## Project Description

Correct filter preset values and sector exclusion lists based on a systematic audit (Issue-Fix.csv) that identified real-world inaccuracies in how the screener filters stocks for the wheel strategy.

## Why This Milestone

The current presets produce results that don't match how options traders actually think about the wheel strategy. A $50 price ceiling excludes blue-chip wheel staples. D/E of 0.5 blanket-excludes the banking sector. Pharmaceuticals exclusion catches big pharma when only biotech carries binary event risk. These are not bugs in the code — the logic works correctly — but the *values* are miscalibrated against real market data.

## User-Visible Outcome

### When this milestone is complete, the user can:

- Run a scan with any preset and get results that include blue-chip stocks (AAPL, MSFT, GOOGL)
- See banks (JPM, BAC, WFC) survive Conservative preset's D/E filter
- See big pharma (JNJ, PFE, ABBV) survive sector exclusion when enabled
- Trust that the excluded ticker count is accurate

### Entry point / environment

- Entry point: Browser SPA at localhost or deployed static site
- Environment: local dev / browser
- Live dependencies involved: none (all changes are constants/logic)

## Completion Class

- Contract complete means: updated preset constants, updated tests, all tests pass
- Integration complete means: preset changes apply correctly through the full scan pipeline
- Operational complete means: none

## Final Integrated Acceptance

To call this milestone complete, we must prove:

- All 3 presets have corrected values matching Issue-Fix.csv audit
- Sector exclusion logic correctly excludes Biotechnology but passes Pharmaceuticals
- All 227+ tests pass, tsc/eslint/prettier clean

## Risks and Unknowns

- E&P industry label verification — need to confirm Finnhub's actual labels for XOM/CVX
- Partial match behavior of `isExcludedSector` — removing 'Pharmaceuticals' must not break other matches

## Existing Codebase / Prior Art

- `src/lib/constants.ts:204-280` — all 3 preset definitions (PRESETS record)
- `src/lib/constants.ts:149-161` — EXCLUDED_INDUSTRIES array
- `src/lib/constants.ts:163-192` — EXCLUDED_TICKERS array (28 entries)
- `src/lib/utils.ts:28-37` — isExcludedSector() function with partial match
- `src/lib/__tests__/filters.test.ts:184-210` — sector exclusion tests
- `src/stores/__tests__/stores.test.ts:68` — preset application tests

> See `.gsd/DECISIONS.md` for all architectural and pattern decisions.

## Relevant Requirements

- R033–R037 — preset value corrections (S01)
- R038–R040 — sector exclusion refinement and audit (S02)

## Scope

### In Scope

- Correct preset values: price ceilings, maxBP, D/E, net margin, IV rank floor
- Remove Pharmaceuticals from EXCLUDED_INDUSTRIES
- Verify E&P industry labels don't catch integrated oil majors
- Audit and fix excluded ticker count documentation
- Update affected tests

### Out of Scope / Non-Goals

- Adding new presets
- Changing the exclusion logic itself (partial match behavior)
- UI changes to filter controls
- Adding per-sector D/E exemptions (raised to 1.0 instead)

## Technical Constraints

- Preset values must stay compatible with the Preset TypeScript type
- Filter tests must continue to pass — update fixtures, don't weaken assertions
- `isExcludedSector` uses partial matching — changes to EXCLUDED_INDUSTRIES must not create false positives

## Integration Points

- None — all changes are internal constants and pure functions

## Open Questions

- Does the UI or any tooltip reference "30 excluded tickers"? Need to search for that string.
