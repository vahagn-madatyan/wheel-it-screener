# S01: Foundation + Business Logic

**Goal:** Vite dev server runs, TypeScript types defined, all scoring/filtering logic extracted as pure functions, Vitest tests pass proving parity with vanilla app.
**Demo:** `npx vitest run` passes all parity tests; `npm run dev` starts Vite dev server with themed App shell; `npx tsc --noEmit` reports zero errors.

## Must-Haves

- Vite + React 19 + TypeScript strict mode scaffold with `@/` path aliases
- Tailwind v4 + shadcn/ui initialized with Financial Terminal Noir CSS variables (oklch)
- TypeScript interfaces for all domain types (StockResult, PutOption, FilterState, etc.)
- All pure business logic extracted: computeWheelMetrics, computeWheelScore, scorePuts, filterStocks, formatters, OCC parser, ticker lists, presets
- Vitest parity tests proving scoring outputs match vanilla app for identical inputs
- Vitest config integrated in vite.config.ts

## Proof Level

- This slice proves: contract (pure function parity with vanilla app via unit tests)
- Real runtime required: no (Vitest runs in Node, dev server verified by startup only)
- Human/UAT required: no

## Verification

- `npx vitest run` — all tests pass (scoring parity, formatters, OCC parser, filter pipeline, sector exclusion, ticker list builder)
- `npm run dev` — Vite dev server starts without errors
- `npx tsc --noEmit` — zero TypeScript errors

## Tasks

- [x] **T01: Scaffold Vite + React 19 + Tailwind v4 + shadcn/ui + Vitest** `est:45m`
  - Why: R001 + R002 — foundation for all subsequent work; nothing else can proceed without the build toolchain, theme variables, and test runner
  - Files: `package.json`, `vite.config.ts`, `tsconfig.json`, `tsconfig.app.json`, `src/index.css`, `src/App.tsx`, `src/main.tsx`, `index.html` (new React entry)
  - Do: Create Vite React+TS project, install Tailwind v4 with `@tailwindcss/vite`, manually install shadcn/ui (tailwind.css + tw-animate-css + @import chain), define Financial Terminal Noir oklch CSS variables in `:root`/`.dark` blocks, configure `@/` path alias in tsconfig + vite, add Vitest to vite config, create minimal App.tsx that renders a themed heading
  - Verify: `npm run dev` starts without errors; `npx vitest run` executes (even with zero tests); `npx tsc --noEmit` passes
  - Done when: Dev server shows themed App shell, Vitest runner works, TypeScript compiles cleanly

- [x] **T02: Define TypeScript interfaces, extract constants, formatters, and utilities** `est:40m`
  - Why: R003 + partial R004 — types are consumed by everything downstream; constants/formatters/utilities are the lowest-risk extractions and establish the module pattern for T03
  - Files: `src/types/index.ts`, `src/lib/constants.ts`, `src/lib/formatters.ts`, `src/lib/utils.ts`, `src/lib/__tests__/formatters.test.ts`, `src/lib/__tests__/utils.test.ts`
  - Do: Define all domain interfaces (StockResult with every field from vanilla, PutOption, FilterState with `number | undefined` for NaN-sentinel fields, WeightConfig, Preset, ScanProgress, ChainData, ApiKeys). Extract TICKER_LISTS, PRESETS, EXCLUDED_INDUSTRIES, EXCLUDED_TICKERS as typed constants. Extract formatNum, formatMktCap, escapeHtml (string-based, no DOM), truncate as pure functions. Extract parseStrikeFromSymbol, isExcludedSector, getTickerList as pure functions. Write unit tests for all formatters and utilities.
  - Verify: `npx vitest run` — formatter and utility tests pass; `npx tsc --noEmit` passes
  - Done when: All 8 domain interfaces defined and importable, all constants typed, formatter/utility tests green

- [x] **T03: Extract scoring and filtering logic with Vitest parity tests** `est:1h`
  - Why: R004 completion + R005 — this is the critical parity risk; scoring functions use implicit coercion, mutation patterns, and specific numeric thresholds that must produce identical outputs under TypeScript strict mode
  - Files: `src/lib/scoring.ts`, `src/lib/put-scoring.ts`, `src/lib/filters.ts`, `src/lib/__tests__/scoring.test.ts`, `src/lib/__tests__/put-scoring.test.ts`, `src/lib/__tests__/filters.test.ts`
  - Do: Extract computeWheelMetrics as pure function (takes StockResult + FilterState, returns new object with computed fields — no mutation). Extract computeWheelScore as pure function (takes stock with metrics + WeightConfig, returns scored stock). Extract scorePuts as pure function (takes PutOption[], targetDelta, returns scored+rec'd array — preserve liqBonus-before-cap ordering, sort-before-rec-assignment). Extract filterStocks as pure pipeline function (takes candidates + FilterState, applies all filters in vanilla order, calls metrics+scoring, returns sorted results). Snapshot known inputs from vanilla app's actual computations for test fixtures. Test edge cases: NaN-sentinel fields, null PE, zero beta, ITM puts, tied scores.
  - Verify: `npx vitest run` — all scoring/filtering parity tests pass; at minimum: wheelMetrics with known stock produces exact ivRank/premiumYield, wheelScore with known inputs produces exact sub-scores and total, scorePuts with known put array produces exact scores and correct rec badge assignments, filterStocks correctly excludes/includes stocks for each filter type
  - Done when: All parity tests green, `npx tsc --noEmit` clean, scoring outputs verified against vanilla app computations

## Files Likely Touched

- `package.json`, `vite.config.ts`, `tsconfig.json`, `tsconfig.app.json`
- `index.html` (new React entry point)
- `src/main.tsx`, `src/App.tsx`, `src/index.css`, `src/vite-env.d.ts`
- `src/types/index.ts`
- `src/lib/constants.ts`, `src/lib/formatters.ts`, `src/lib/utils.ts`
- `src/lib/scoring.ts`, `src/lib/put-scoring.ts`, `src/lib/filters.ts`
- `src/lib/__tests__/formatters.test.ts`, `src/lib/__tests__/utils.test.ts`
- `src/lib/__tests__/scoring.test.ts`, `src/lib/__tests__/put-scoring.test.ts`, `src/lib/__tests__/filters.test.ts`
