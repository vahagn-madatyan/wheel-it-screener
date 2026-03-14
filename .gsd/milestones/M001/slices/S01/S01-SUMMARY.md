---
id: S01
parent: M001
milestone: M001
provides:
  - Vite + React 19 + TypeScript dev environment with strict mode and @/ path aliases
  - Tailwind v4 + shadcn/ui with Financial Terminal Noir oklch theme (dark + light)
  - Vitest test runner integrated in vite.config.ts
  - 8 domain TypeScript interfaces (StockResult, PutOption, FilterState, WeightConfig, Preset, ScanProgress, ChainData, ApiKeys)
  - Typed constants (TICKER_LISTS, PRESETS, EXCLUDED_INDUSTRIES, EXCLUDED_TICKERS, DEFAULT_WEIGHTS)
  - Pure formatters (formatNum, formatMktCap, escapeHtml, truncate)
  - Pure utilities (parseStrikeFromSymbol, isExcludedSector, getTickerList)
  - computeWheelMetrics — IV rank, premium yield, buying power, SMA200 from StockResult + filters
  - computeWheelScore — weighted 6-factor composite (premium, liquidity, stability, fundamentals)
  - scorePuts — 5-factor put scoring with rec badge assignment
  - filterStocks — complete filter pipeline (14 filters → metrics → scoring → sorted results)
requires:
  - slice: none
    provides: first slice, no dependencies
affects:
  - S02 (consumes types, constants, scoring functions)
  - S03 (consumes Vite scaffold, theme, path aliases)
key_files:
  - vite.config.ts
  - tsconfig.app.json
  - src/index.css
  - src/theme.css
  - src/types/index.ts
  - src/lib/constants.ts
  - src/lib/formatters.ts
  - src/lib/utils.ts
  - src/lib/scoring.ts
  - src/lib/put-scoring.ts
  - src/lib/filters.ts
key_decisions:
  - "vite@7.3.1 + @vitejs/plugin-react@5.2.0 to resolve @tailwindcss/vite peer dep conflict (Decision #11)"
  - "vite-tsconfig-paths for @/ alias resolution — single source of truth in tsconfig (Decision #13)"
  - "Vanilla index.html renamed to index.vanilla.html — preserved for reference (Decision #14)"
  - "escapeHtml uses string-based replace chain — must run in Node/Vitest (Decision #15)"
  - "All scoring functions are pure — new objects returned, no mutation, explicit params (Decision #16)"
  - "NaN-sentinel fields use undefined instead of NaN + isNaN() (Decision #17)"
patterns_established:
  - "shadcn/ui CSS variable pattern: theme.css (oklch vars) → index.css (@import chain + @theme inline + @custom-variant dark)"
  - "Module layout: src/lib/ for pure functions, src/types/ for interfaces, src/lib/__tests__/ for unit tests"
  - "Pure scoring functions: typed inputs → new object output, no side effects, no global state"
  - "Filter pipeline composition: filterStocks orchestrates metrics → filters → scoring → sort as single pure pipeline"
observability_surfaces:
  - None — all pure functions. Failures surface via `npx vitest run` with descriptive assertions.
drill_down_paths:
  - .gsd/milestones/M001/slices/S01/tasks/T01-SUMMARY.md
  - .gsd/milestones/M001/slices/S01/tasks/T02-SUMMARY.md
  - .gsd/milestones/M001/slices/S01/tasks/T03-SUMMARY.md
duration: ~33min
verification_result: passed
completed_at: 2026-03-12
---

# S01: Foundation + Business Logic

**Vite + React 19 + TypeScript scaffold running with Financial Terminal Noir theme, all domain types defined, and 128 Vitest parity tests proving scoring/filtering logic matches vanilla app.**

## What Happened

Built the project foundation in three tasks:

**T01 — Scaffold.** Created the Vite + React 19 + TypeScript project alongside the existing vanilla files. Renamed vanilla `index.html` to `index.vanilla.html` to avoid conflict with Vite's entry point. Resolved a peer dependency conflict between @tailwindcss/vite (requires vite 5-7) and @vitejs/plugin-react@6 (requires vite 8) by pinning plugin-react@5.2.0. Built the Financial Terminal Noir theme as oklch CSS variables covering all shadcn semantic tokens in both `:root` and `.dark` blocks, using shadcn/ui v4 manual install pattern.

**T02 — Types + Constants + Formatters.** Defined all 8 domain interfaces matching every field from vanilla app.js. Extracted ticker lists (3 universes), preset configs (3 presets with exact filter values), excluded sectors/tickers, and default weights as typed constants. Extracted formatters (formatNum, formatMktCap, escapeHtml as string-based replace chain, truncate) and utilities (parseStrikeFromSymbol, isExcludedSector, getTickerList) as pure functions. 49 tests covering all formatters and utilities.

**T03 — Scoring + Filtering.** Extracted the critical business logic: computeWheelMetrics (IV rank estimation, premium yield, SMA200 status), computeWheelScore (weighted 6-factor composite), scorePuts (5-factor with liqBonus-before-cap ordering and rec badge assignment), and filterStocks (14-filter pipeline → metrics → scoring → sort). All functions are pure — no mutation, no globals. 79 additional tests proving exact numeric parity with vanilla computations, including edge cases (NaN sentinels, null PE, zero beta, ITM puts, tied scores).

## Verification

- `npx vitest run` — **128 tests pass** across 6 files (22 formatter + 26 utility + 29 scoring + 17 put-scoring + 33 filters + 1 setup)
- `npx tsc --noEmit` — zero TypeScript errors
- `npm run dev` — Vite dev server starts on localhost:5173, themed App shell renders with emerald primary on dark background

## Requirements Advanced

- R001 — Vite + React 19 + TypeScript scaffold complete with strict mode and @/ aliases
- R002 — Tailwind v4 + shadcn/ui initialized with full oklch Financial Terminal Noir theme (both dark and light blocks)
- R003 — All 8 domain TypeScript interfaces defined and importable
- R004 — All scoring, filtering, formatters, ticker lists, OCC parser, presets extracted as pure TypeScript functions
- R005 — 128 Vitest parity tests covering all business logic

## Requirements Validated

- R001 — `npm run dev` starts Vite dev server, `npx tsc --noEmit` passes with strict mode
- R003 — All 8 interfaces importable, consumed by scoring/filter functions, tsc clean
- R004 — Pure functions extracted, consume typed inputs, return new objects, all produce identical outputs to vanilla
- R005 — 128 tests pass covering wheelScore, putScore, filterStocks, formatters, OCC parser with known inputs matching vanilla behavior

## New Requirements Surfaced

- None

## Requirements Invalidated or Re-scoped

- None

## Deviations

- Vanilla `index.html` renamed to `index.vanilla.html` in T01 (was planned for S08) — necessary because Vite requires `index.html` at project root.
- Added `src/__tests__/setup.test.ts` placeholder — Vitest exits with code 1 when zero test files exist, so a minimal test was needed for T01 verification.

## Known Limitations

- R002 partially validated — theme CSS variables are defined and resolve correctly in Tailwind utilities, but visual polish (noise texture, gradient borders, font trio) deferred to S07.
- No runtime components beyond a placeholder App shell — S02 adds stores, S03 adds layout.

## Follow-ups

- None discovered during execution.

## Files Created/Modified

- `package.json` — project manifest with all dependencies and scripts
- `vite.config.ts` — Vite + React + Tailwind + tsconfig-paths + Vitest
- `tsconfig.json`, `tsconfig.app.json`, `tsconfig.node.json` — TypeScript configs with @/ aliases
- `index.html` — Vite entry point with `class="dark"` on html
- `index.vanilla.html` — renamed original vanilla entry (preserved)
- `src/main.tsx` — React 19 entry point
- `src/App.tsx` — minimal themed component
- `src/index.css` — Tailwind + shadcn/ui import chain + @theme inline
- `src/theme.css` — Financial Terminal Noir oklch CSS variables
- `src/vite-env.d.ts` — Vite client type reference
- `src/types/index.ts` — all 8 domain interfaces
- `src/lib/constants.ts` — ticker lists, presets, exclusions, default weights
- `src/lib/formatters.ts` — formatNum, formatMktCap, escapeHtml, truncate
- `src/lib/utils.ts` — parseStrikeFromSymbol, isExcludedSector, getTickerList
- `src/lib/scoring.ts` — computeWheelMetrics, computeWheelScore
- `src/lib/put-scoring.ts` — scorePuts with rec badge assignment
- `src/lib/filters.ts` — filterStocks pipeline
- `src/lib/__tests__/formatters.test.ts` — 22 tests
- `src/lib/__tests__/utils.test.ts` — 26 tests
- `src/lib/__tests__/scoring.test.ts` — 29 tests
- `src/lib/__tests__/put-scoring.test.ts` — 17 tests
- `src/lib/__tests__/filters.test.ts` — 33 tests
- `src/__tests__/setup.test.ts` — placeholder test

## Forward Intelligence

### What the next slice should know
- All types live in `src/types/index.ts`. Import from `@/types`. FilterState extends WeightConfig.
- Constants in `@/lib/constants.ts` — PRESETS has string-typed targetDTE/targetDelta (select-bound values), while FilterState has number-typed versions (parsed). Stores must handle this conversion.
- Scoring functions in `@/lib/scoring.ts` and `@/lib/put-scoring.ts` are pure — they take inputs and return new objects. `computeWheelMetrics` expects an explicit `earningsEntry` parameter, not a global map lookup.

### What's fragile
- `@vitejs/plugin-react` pinned to 5.2.0 due to @tailwindcss/vite peer dep — if upgrading Tailwind or Vite, recheck this constraint (Decision #11).
- Preset targetDTE/targetDelta are strings in Preset type but numbers in FilterState — the store's `applyPreset` must parseInt/parseFloat correctly.

### Authoritative diagnostics
- `npx vitest run` — 128 tests across 6 files. If any scoring/filter behavior seems wrong downstream, run these first. Tests include exact numeric assertions against vanilla computations.
- `npx tsc --noEmit` — catches type mismatches instantly.

### What assumptions changed
- Vanilla index.html rename happened in S01 (was assumed S08). The file exists as `index.vanilla.html` at project root.
