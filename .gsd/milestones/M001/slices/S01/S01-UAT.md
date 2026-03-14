# S01: Foundation + Business Logic — UAT

**Milestone:** M001
**Written:** 2026-03-12

## UAT Type

- UAT mode: artifact-driven
- Why this mode is sufficient: S01 is pure infrastructure and business logic — no UI interactions, no runtime state. All verification is through test execution, type checking, and dev server startup.

## Preconditions

- Node.js 18+ installed
- `npm install` has been run in project root

## Smoke Test

Run `npx vitest run` — 128 tests pass across 6 files.

## Test Cases

### 1. TypeScript compiles cleanly

1. Run `npx tsc --noEmit`
2. **Expected:** Exit code 0, no errors

### 2. All parity tests pass

1. Run `npx vitest run`
2. **Expected:** 128 tests pass across 6 test files (formatters, utils, scoring, put-scoring, filters, setup)

### 3. Dev server starts

1. Run `npm run dev`
2. **Expected:** Vite dev server starts on localhost:5173 without errors

### 4. Scoring parity — wheel metrics

1. Review `src/lib/__tests__/scoring.test.ts`
2. **Expected:** computeWheelMetrics with stock (price=50, low=35, high=60, beta=1.0) produces ivRank=46, premiumYield≈14.0 at DTE=30/delta=0.30

### 5. Scoring parity — put scoring

1. Review `src/lib/__tests__/put-scoring.test.ts`
2. **Expected:** scorePuts assigns rec badges correctly: top 2 OTM puts by score get "best" (if ≥50), then "good"/"ok"/"caution" by threshold. ITM puts always get "itm" badge.

### 6. Filter pipeline ordering

1. Review `src/lib/__tests__/filters.test.ts`
2. **Expected:** filterStocks applies all 14 filters in vanilla order, calls computeWheelMetrics before buyingPower filter, returns results sorted by wheelScore descending.

## Edge Cases

### NaN-sentinel fields

1. Call filterStocks with FilterState where maxDebtEquity/minNetMargin/minSalesGrowth/minROE are `undefined`
2. **Expected:** Those filters are skipped (stock passes through). When set to a number, filter is applied.

### Zero beta stock

1. Call computeWheelMetrics with stock having beta=0
2. **Expected:** ivRank computed using beta contribution of 0, no division by zero

### ITM puts

1. Call scorePuts with puts where strike > current price
2. **Expected:** ITM puts get rec badge "itm" regardless of score

### OCC symbol parsing

1. Call parseStrikeFromSymbol with "AAPL250117C00150000"
2. **Expected:** Returns 150 (8-digit strike field / 1000)

## Failure Signals

- `npx vitest run` exits with failures — scoring or filtering parity broken
- `npx tsc --noEmit` reports errors — type definitions inconsistent
- `npm run dev` fails to start — build toolchain misconfigured
- Import from `@/types` or `@/lib/*` fails — path alias broken

## Requirements Proved By This UAT

- R001 — Vite + React 19 + TypeScript scaffold verified by tsc + dev server start
- R003 — TypeScript interfaces verified by tsc compilation and test imports
- R004 — Pure business logic extraction verified by 128 parity tests
- R005 — Unit test coverage for scoring/filtering verified by vitest run

## Not Proven By This UAT

- R002 — Visual theme appearance (CSS variables defined but not visually verified beyond placeholder App shell — visual polish is S07)
- Runtime component behavior — no React components beyond App shell
- API integration — no service calls (S02)
- Browser rendering of theme — dev server starts but no layout to verify (S03)

## Notes for Tester

This is a pure infrastructure slice. If all three commands pass (`vitest run`, `tsc --noEmit`, `npm run dev`), the slice is verified. The 128 tests are the authoritative proof of business logic parity — spot-check the test fixtures in `src/lib/__tests__/` if you want to verify the test inputs match vanilla app.js computations.
