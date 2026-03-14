---
id: T03
parent: S01
milestone: M001
provides:
  - computeWheelMetrics — pure function computing ivRank, premiumYield, buyingPower, SMA200 from StockResult + filters
  - computeWheelScore — pure function computing premiumScore, liquidityScore, stabilityScore, fundamentalsScore, wheelScore
  - scorePuts — pure function scoring put options with sub-scores, weighted total, and rec badge assignment
  - filterStocks — complete filter pipeline applying all vanilla filters in order, returns scored/sorted results
key_files:
  - src/lib/scoring.ts
  - src/lib/put-scoring.ts
  - src/lib/filters.ts
  - src/lib/__tests__/scoring.test.ts
  - src/lib/__tests__/put-scoring.test.ts
  - src/lib/__tests__/filters.test.ts
key_decisions:
  - "computeWheelMetrics accepts earningsEntry as explicit parameter instead of global earningsMap lookup — makes function pure and testable without global state"
  - "NaN-sentinel fields (maxDebtEquity, minNetMargin, minSalesGrowth, minROE) use undefined guard instead of vanilla's !isNaN() — TypeScript-idiomatic equivalent"
  - "All scoring functions return new objects (spread operator) — no mutation of inputs, enables React state management"
  - "wheelScore computed from unrounded sub-scores then rounded — matches vanilla which rounds the final result, not intermediates"
patterns_established:
  - "Pure scoring functions: take typed inputs, return new objects, no side effects — src/lib/scoring.ts pattern"
  - "Filter pipeline composition: filterStocks orchestrates metrics→filters→scoring→sort as single pure pipeline"
  - "EarningsEntry interface exported from scoring.ts for cross-module use"
observability_surfaces:
  - None — pure functions with no runtime state. Test failures surface via `npx vitest run`.
duration: ~15min
verification_result: passed
completed_at: 2026-03-12
blocker_discovered: false
---

# T03: Extract scoring and filtering logic with Vitest parity tests

**Extracted computeWheelMetrics, computeWheelScore, scorePuts, and filterStocks as pure TypeScript functions with 79 parity tests proving exact numeric match to vanilla app.js.**

## What Happened

Extracted four critical business logic functions from vanilla app.js into typed, pure TypeScript modules:

1. **scoring.ts** — `computeWheelMetrics` (IV rank estimation from 52w range + beta, premium yield, SMA200 status) and `computeWheelScore` (weighted composite of premium/liquidity/stability/fundamentals sub-scores). Both return new objects.

2. **put-scoring.ts** — `scorePuts` scores put options on spread quality (30%), liquidity (25%), premium yield (20%), delta sweet spot (15%), and IV level (10%). Critical: liqBonus is applied before the min(100) cap. Rec badge assignment: top 2 OTM puts by score get "best" (if ≥50), then "good"/"ok"/"caution" thresholds.

3. **filters.ts** — `filterStocks` applies all 14 filters in vanilla order, calls computeWheelMetrics (which must run before buyingPower filter), then computeWheelScore, and returns results sorted by wheelScore descending. NaN-sentinel fields use `undefined` instead of `!isNaN()`.

All functions are pure — no mutation of input objects, no global state access.

## Verification

- `npx vitest run` — **128 tests pass** (29 scoring, 17 put-scoring, 33 filters, plus 49 prior from T01/T02)
- `npx tsc --noEmit` — zero TypeScript errors
- `npm run dev` — Vite dev server starts cleanly on port 5173
- Spot-checked: default stock (price=50, low=35, high=60, beta=1.0) produces ivRank=46, premiumYield=14.0 at DTE=30/delta=0.30 — matches manual computation against vanilla formulas

## Diagnostics

None — pure functions with no runtime state. Test failures will surface via `npx vitest run` with descriptive assertion messages.

## Deviations

- One test expected sma200Pct of -6.3 for price=45/sma=48, but JS Math.round(-62.5)=-62 (rounds toward +∞), yielding -6.2. Fixed expected value to match actual JS behavior.

## Known Issues

None.

## Files Created/Modified

- `src/lib/scoring.ts` — computeWheelMetrics + computeWheelScore pure functions
- `src/lib/put-scoring.ts` — scorePuts pure function with rec badge assignment
- `src/lib/filters.ts` — filterStocks pipeline orchestrating all filters + scoring
- `src/lib/__tests__/scoring.test.ts` — 29 tests covering ivRank, premiumYield, SMA200, all sub-scores
- `src/lib/__tests__/put-scoring.test.ts` — 17 tests covering spread/liq/prem/delta/IV tiers, liqBonus ordering, rec badges
- `src/lib/__tests__/filters.test.ts` — 33 tests covering each filter type, NaN-sentinel handling, filter ordering, sort order
