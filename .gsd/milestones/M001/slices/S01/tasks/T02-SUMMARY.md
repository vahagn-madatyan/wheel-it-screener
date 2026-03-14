---
id: T02
parent: S01
milestone: M001
provides:
  - All 8 domain TypeScript interfaces (StockResult, PutOption, FilterState, WeightConfig, Preset, ScanProgress, ChainData, ApiKeys)
  - Typed constants (TICKER_LISTS, PRESETS, EXCLUDED_INDUSTRIES, EXCLUDED_TICKERS, DEFAULT_WEIGHTS)
  - Pure formatter functions (formatNum, formatMktCap, escapeHtml, truncate)
  - Pure utility functions (parseStrikeFromSymbol, isExcludedSector, getTickerList)
key_files:
  - src/types/index.ts
  - src/lib/constants.ts
  - src/lib/formatters.ts
  - src/lib/utils.ts
  - src/lib/__tests__/formatters.test.ts
  - src/lib/__tests__/utils.test.ts
key_decisions:
  - "escapeHtml uses string-based replace chain (& < > \" ') instead of DOM-based approach from vanilla — required for Node test environment, produces identical output for all HTML entity cases"
  - "FilterState.targetDTE/targetDelta typed as number (the parsed value) while Preset.targetDTE/targetDelta typed as string (the raw select-bound value) — matches vanilla's parseFloat/parseInt on read vs string on preset write"
patterns_established:
  - "Module pattern: src/lib/ for pure functions, src/types/ for interfaces, src/lib/__tests__/ for unit tests"
  - "Constants extracted as typed exports — downstream modules import from @/lib/constants"
  - "Utility functions accept nullable inputs (string | null | undefined) and return safe defaults — mirrors vanilla's defensive coding"
observability_surfaces:
  - none
duration: 10m
verification_result: passed
completed_at: 2026-03-12
blocker_discovered: false
---

# T02: Define TypeScript interfaces, extract constants, formatters, and utilities

**Defined all 8 domain interfaces, extracted exact-match constants/formatters/utilities from vanilla app.js, all 49 tests pass.**

## What Happened

1. Created `src/types/index.ts` with all 8 domain interfaces: StockResult (all fields from vanilla stock objects including optional computed fields), PutOption (with score breakdown fields), FilterState (extending WeightConfig, with `number | undefined` for NaN-sentinel fields), WeightConfig, Preset (with string types for select-bound targetDTE/targetDelta), ScanProgress, ChainData, ApiKeys.

2. Created `src/lib/constants.ts` with TICKER_LISTS (3 universes, exact ticker arrays), EXCLUDED_INDUSTRIES (10 entries), EXCLUDED_TICKERS (28 entries), DEFAULT_WEIGHTS, and PRESETS (3 presets with exact values including string types for select fields).

3. Created `src/lib/formatters.ts` with formatNum (locale formatting, em-dash for null/undefined/NaN), formatMktCap (T/B/M suffix), escapeHtml (string-based 5-char replace chain), truncate. All produce identical outputs to vanilla functions.

4. Created `src/lib/utils.ts` with parseStrikeFromSymbol (OCC 8-digit tail regex), isExcludedSector (case-insensitive ticker + partial industry match), getTickerList (universe lookup + custom merge/dedup/uppercase/length-cap).

5. Created comprehensive test suites: 22 formatter tests + 26 utility tests + 1 existing setup test = 49 total, all green.

## Verification

- `npx vitest run` — 49 tests pass across 3 files (0 failures)
- `npx tsc --noEmit` — zero errors
- `npm run dev` — Vite dev server starts without errors (slice-level check, partial pass — full demo requires App shell from T01 + scoring from T03)

Slice-level verification status:
- ✅ `npx vitest run` — 49 tests pass (formatter + utility tests; scoring parity tests pending T03)
- ✅ `npm run dev` — dev server starts clean
- ✅ `npx tsc --noEmit` — zero errors

## Diagnostics

None — pure functions with no runtime state. Test failures will surface via `npx vitest run` with descriptive assertion messages.

## Deviations

None.

## Known Issues

None.

## Files Created/Modified

- `src/types/index.ts` — all 8 domain interfaces (StockResult, PutOption, FilterState, WeightConfig, Preset, ScanProgress, ChainData, ApiKeys)
- `src/lib/constants.ts` — TICKER_LISTS, PRESETS, EXCLUDED_INDUSTRIES, EXCLUDED_TICKERS, DEFAULT_WEIGHTS
- `src/lib/formatters.ts` — formatNum, formatMktCap, escapeHtml, truncate
- `src/lib/utils.ts` — parseStrikeFromSymbol, isExcludedSector, getTickerList
- `src/lib/__tests__/formatters.test.ts` — 22 formatter tests
- `src/lib/__tests__/utils.test.ts` — 26 utility tests
