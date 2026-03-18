---
id: M003-8nlgd1
provides:
  - Corrected 6 preset numeric values across 3 presets per Issue-Fix.csv audit
  - Removed Pharmaceuticals from sector exclusion — big pharma survives filtering
  - Verified E&P exclusion label safety for integrated oil majors (XOM, CVX)
  - Locked EXCLUDED_TICKERS count at 28 with regression test
key_decisions:
  - Preset value assertions use literal numbers, never self-referencing the PRESETS object
  - Pharmaceuticals removed; Biotechnology remains as the actual binary-event-risk sector
patterns_established:
  - Audit-style test blocks with requirement IDs in test names for traceability
  - Constant array length assertions as regression guards for curated exclusion lists
observability_surfaces:
  - "vitest: `preset audit values (R033–R037)` describe block — 6 literal-value assertions"
  - "vitest: Pharmaceuticals→false, Integrated Oil→false, EXCLUDED_TICKERS length===28 assertions"
requirement_outcomes:
  - id: R033
    from_status: active
    to_status: validated
    proof: finviz_cut2.maxPrice=150 and conservative.maxPrice=150 asserted with literal-value tests in stores.test.ts
  - id: R034
    from_status: active
    to_status: validated
    proof: conservative.maxBP=10000 asserted with literal-value test in stores.test.ts
  - id: R035
    from_status: active
    to_status: validated
    proof: conservative.maxDebtEquity=1.0 asserted with literal-value test in stores.test.ts
  - id: R036
    from_status: active
    to_status: validated
    proof: aggressive.minNetMargin=-10 asserted with literal-value test in stores.test.ts
  - id: R037
    from_status: active
    to_status: validated
    proof: conservative.minIVRank=25 asserted with literal-value test in stores.test.ts
  - id: R038
    from_status: active
    to_status: validated
    proof: Pharmaceuticals removed from EXCLUDED_INDUSTRIES; isExcludedSector returns false; integration test confirms survival through filterStocks
  - id: R039
    from_status: active
    to_status: validated
    proof: isExcludedSector('Integrated Oil & Gas', null) asserted false in utils.test.ts — E&P string doesn't partial-match
  - id: R040
    from_status: active
    to_status: validated
    proof: EXCLUDED_TICKERS.toHaveLength(28) assertion in utils.test.ts; no stale "30" references in codebase
duration: 18m
verification_result: passed
completed_at: 2026-03-17
---

# M003-8nlgd1: Filter Preset Tuning & Sector Exclusion Audit

**Corrected all miscalibrated filter preset values and refined sector exclusion lists so the screener produces results calibrated to how options traders actually use the wheel strategy — blue-chip stocks survive, banks aren't blanket-excluded, and only genuine binary-risk sectors are filtered.**

## What Happened

Two independent slices attacked separate sections of `src/lib/constants.ts` — S01 corrected 6 numeric preset values, S02 refined the sector exclusion array and audited the ticker count.

**S01 (Preset value corrections)** changed 6 values in the `PRESETS` record:
- `finviz_cut2.maxPrice`: 50 → 150 and `conservative.maxPrice`: 100 → 150 — blue-chip wheel staples (AAPL, MSFT, GOOGL) now survive the default scan
- `conservative.maxBP`: 15000 → 10000 — tighter buying power for conservative traders
- `conservative.maxDebtEquity`: 0.5 → 1.0 — banks (JPM, BAC, WFC) no longer blanket-excluded
- `conservative.minIVRank`: 20 → 25 — ensures meaningful vol premium exists
- `aggressive.minNetMargin`: -50 → -10 — rejects deeply unprofitable companies

Each correction was pinned with a literal-value test assertion (not self-referencing the PRESETS object) in a `describe('preset audit values (R033–R037)')` block.

**S02 (Sector exclusion refinement & ticker audit)** made three changes:
- Removed `'Pharmaceuticals'` from `EXCLUDED_INDUSTRIES` (10 → 9 entries) — big pharma (JNJ, PFE, ABBV) now survives sector filtering. Biotechnology remains as the genuine binary-event-risk exclusion.
- Added a test proving `isExcludedSector('Integrated Oil & Gas', null)` returns `false` — the E&P exclusion string doesn't partial-match integrated oil majors (XOM, CVX).
- Added `EXCLUDED_TICKERS.toHaveLength(28)` assertion and confirmed no stale "30" references exist in the codebase.

Both slices touched `constants.ts` but in entirely different sections (PRESETS vs EXCLUDED_INDUSTRIES/EXCLUDED_TICKERS), so there were no merge conflicts.

## Cross-Slice Verification

Each success criterion from the roadmap was verified:

| Criterion | Evidence |
|-----------|----------|
| Finviz Cut 2 preset includes stocks up to $150 | `finviz_cut2.maxPrice` is 150 in constants.ts; literal-value test asserts `150` in stores.test.ts |
| Conservative preset allows banks (D/E up to 1.0) and has $10K buying power | `conservative.maxDebtEquity` is 1.0, `conservative.maxBP` is 10000; both asserted with literal tests |
| Aggressive preset rejects net margin below -10% | `aggressive.minNetMargin` is -10; literal-value test asserts `-10` |
| Pharmaceuticals stocks survive sector exclusion; Biotechnology does not | `Pharmaceuticals` removed from EXCLUDED_INDUSTRIES; `isExcludedSector('Pharmaceuticals', null)` returns false; integration test in filters.test.ts confirms; `Biotechnology` still present |
| EXCLUDED_TICKERS count matches actual array length (28) | `EXCLUDED_TICKERS.toHaveLength(28)` assertion passes; array has exactly 28 entries |
| All tests pass, build succeeds | 236 tests pass (12 files); `tsc --noEmit` clean; `eslint .` 0 errors; `prettier --check .` clean; `npm run build` succeeds |

**Definition of Done verification:**
- ✅ All preset values corrected per Issue-Fix.csv audit
- ✅ Pharmaceuticals removed from EXCLUDED_INDUSTRIES
- ✅ Excluded ticker count verified accurate (28)
- ✅ 236 Vitest tests pass (was 227+, now 236)
- ✅ `tsc --noEmit` exits 0
- ✅ `eslint .` exits 0 (1 pre-existing warning, 0 errors)
- ✅ `prettier --check .` exits 0
- ✅ `npm run build` succeeds

## Requirement Changes

- R033: active → validated — finviz_cut2.maxPrice=150 and conservative.maxPrice=150 asserted with literal-value tests
- R034: active → validated — conservative.maxBP=10000 asserted with literal-value test
- R035: active → validated — conservative.maxDebtEquity=1.0 asserted with literal-value test
- R036: active → validated — aggressive.minNetMargin=-10 asserted with literal-value test
- R037: active → validated — conservative.minIVRank=25 asserted with literal-value test
- R038: active → validated — Pharmaceuticals removed from EXCLUDED_INDUSTRIES; integration test confirms survival
- R039: active → validated — isExcludedSector('Integrated Oil & Gas', null) asserted false
- R040: active → validated — EXCLUDED_TICKERS.toHaveLength(28) passes; no stale count references

## Forward Intelligence

### What the next milestone should know
- All 40 requirements are now validated. The screener is feature-complete for its current scope.
- 236 tests across 12 files provide comprehensive regression coverage of scoring, filtering, presets, sector exclusion, and store behavior.
- The main JS bundle is 530KB (over the 500KB Vite warning threshold). Future feature additions should use React.lazy() code-splitting.

### What's fragile
- Main bundle size (530KB) is above Vite's 500KB warning. Any new feature code added to the main chunk will increase this. Use dynamic imports for heavy components.
- Pre-existing ESLint warning in ScoringWeightsSection.tsx (react-refresh/only-export-components) — cosmetic, not blocking.

### Authoritative diagnostics
- `npx vitest run --reporter=verbose | grep "preset audit\|Pharmaceut\|Integrated\|ticker count"` — shows all 9 audit-specific test assertions with requirement IDs
- `npm run build` — confirms production bundle compiles clean

### What assumptions changed
- No assumptions changed during this milestone. All 8 corrections were straightforward constant-value edits matching the Issue-Fix.csv audit exactly.

## Files Created/Modified

- `src/lib/constants.ts` — 6 preset values corrected (PRESETS), Pharmaceuticals removed from EXCLUDED_INDUSTRIES
- `src/stores/__tests__/stores.test.ts` — 6 literal-value preset audit assertions (R033–R037)
- `src/lib/__tests__/utils.test.ts` — Pharmaceuticals→false, E&P safety, ticker count assertions (R038–R040)
- `src/lib/__tests__/filters.test.ts` — Pharmaceuticals-survives-filter integration test (R038)
- `README.md` — pre-existing prettier formatting fixed
- `src/lib/filters.ts` — pre-existing prettier formatting fixed
