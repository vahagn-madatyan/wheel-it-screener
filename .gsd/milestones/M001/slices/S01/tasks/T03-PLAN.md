---
estimated_steps: 5
estimated_files: 6
---

# T03: Extract scoring and filtering logic with Vitest parity tests

**Slice:** S01 — Foundation + Business Logic
**Milestone:** M001

## Description

Extract the three critical business logic functions from vanilla `app.js` — computeWheelMetrics, computeWheelScore, and scorePuts — plus the filter pipeline. These functions use implicit coercion, in-place mutation, and specific numeric thresholds that must produce identical outputs under TypeScript strict mode. Each function becomes a pure TypeScript function that takes typed inputs and returns new objects (no mutation). The filter pipeline is extracted as a single `filterStocks` function that applies all filters in the same order as vanilla, calls metrics+scoring, and returns sorted results. Vitest tests use known inputs snapshotted from the vanilla app's computations to prove exact parity.

## Steps

1. Create `src/lib/scoring.ts` — extract `computeWheelMetrics(stock: StockResult, filters: FilterState): StockResult` as a pure function. Takes a stock and filters, returns a **new** StockResult with ivRank, premiumYield, buyingPower, earningsDays, sma200Status, sma200Pct computed. Replicate the exact IV rank estimation formula: `positionFactor = max(0, (1 - pricePosition)) * 40`, `betaFactor = min(max(beta, 0.3), 3) * 20` (default 25 if no beta), `rangeFactor = min(rangePercent * 0.8, 50)`, `ivRank = min(100, max(0, round(positionFactor + betaFactor + rangeFactor * 0.3)))`. Replicate premium yield: `monthlyYield = (ivRank/100) * 2.5 * (targetDelta/0.30)`, `premiumYield = round(monthlyYield * (365/targetDTE) * 10) / 10`, clamped 0–100. Note: earningsDays comes from an external earnings map — accept it as an optional parameter rather than a global lookup.
2. In the same file, extract `computeWheelScore(stock: StockResult, weights: WeightConfig): StockResult` — pure function returning new object with premiumScore, liquidityScore, stabilityScore, fundamentalsScore, and wheelScore. Replicate exact formulas: premiumScore = min(100, premYield/35*100), liquidityScore = min(100, vol/20*100) where vol = avgVolume || avgVolume3M || 0, stabilityScore = beta sweet spot tiers blended 60/40 with 52w range position tiers, fundamentalsScore = PE tiers + dividend/ROE/analyst/margin bonuses capped at 100. Final wheelScore = round(weighted sum / totalWeight).
3. Create `src/lib/put-scoring.ts` — extract `scorePuts(puts: PutOption[], targetDelta: number): PutOption[]` as a pure function. Returns new array of scored puts. For ITM puts: putScore=0, rec="itm". For OTM: compute spreadScore (6-tier), liquidityScore (oiScore*0.6 + volScore*0.4 + liqBonus, THEN min(100)), premScore (premYield/25*100), deltaScore (5-tier based on diff from targetDelta), ivScore (4-tier). Store sub-scores on each put. Compute putScore as weighted sum (30/25/20/15/10). **Critical ordering**: liqBonus added before min(100) cap. Sort OTM puts with bid>0 by putScore descending, then assign recs: top 2 with score≥50 → "best", ≥60 → "good", ≥35 → "ok", else "caution". Unscored non-ITM puts get "caution".
4. Create `src/lib/filters.ts` — extract `filterStocks(candidates: StockResult[], filters: FilterState, earningsMap?: Record<string, {date: string, daysAway: number}>): StockResult[]` as a pure function. Apply filters in vanilla order: marketCap → volume → PE → D/E (guard with `filters.maxDebtEquity !== undefined`) → netMargin → salesGrowth → ROE → sector exclusion → computeWheelMetrics → buyingPower → dividends → SMA200 → earnings proximity → IV rank → computeWheelScore. Return sorted by wheelScore descending. The `undefined` guard replaces the vanilla `!isNaN()` guard for NaN-sentinel fields.
5. Create test files with known-input fixtures:
   - `src/lib/__tests__/scoring.test.ts` — test computeWheelMetrics with a stock at various 52w range positions and betas, verify exact ivRank and premiumYield. Test computeWheelScore with known sub-scores, verify exact wheelScore. Test edge cases: null beta (default 25 betaFactor), zero high/low (default ivRank 30), null PE, zero volume.
   - `src/lib/__tests__/put-scoring.test.ts` — test scorePuts with a put array including ITM and OTM puts, verify exact sub-scores and putScore. Verify rec badge assignment: top 2 OTM by score get "best" (if ≥50), verify "good"/"ok"/"caution" thresholds. Verify liqBonus ordering matters (put with OI>100 gets bonus before cap). Test with all nulls/zeros.
   - `src/lib/__tests__/filters.test.ts` — test filterStocks with candidates that should pass/fail each filter type. Verify NaN-sentinel filters (undefined means "don't filter"). Verify filter ordering (metrics computed before buyingPower filter). Verify final sort by wheelScore.

## Must-Haves

- [ ] computeWheelMetrics produces exact ivRank and premiumYield for known inputs
- [ ] computeWheelScore produces exact sub-scores and wheelScore for known inputs
- [ ] scorePuts produces exact sub-scores, putScore, and rec badges for known inputs
- [ ] liqBonus applied before min(100) cap in put scoring
- [ ] Rec badge assignment depends on sort order (top 2 OTM by score)
- [ ] filterStocks applies all filters in vanilla order with correct NaN-sentinel handling
- [ ] All scoring/filtering functions are pure (no mutation of inputs)
- [ ] All parity tests pass

## Verification

- `npx vitest run` — all scoring, put-scoring, and filter tests pass
- `npx tsc --noEmit` — zero TypeScript errors
- Manual spot-check: pick a known stock with specific metrics, run computeWheelMetrics → computeWheelScore manually and compare to vanilla app.js output

## Inputs

- `src/types/index.ts` — domain interfaces from T02
- `src/lib/constants.ts` — EXCLUDED_INDUSTRIES, EXCLUDED_TICKERS from T02
- `src/lib/utils.ts` — isExcludedSector from T02
- `app.js` L496–L610 (wheel metrics + score), L1047–L1117+ (put scoring), L470–L540 (filter pipeline)

## Expected Output

- `src/lib/scoring.ts` — computeWheelMetrics + computeWheelScore
- `src/lib/put-scoring.ts` — scorePuts
- `src/lib/filters.ts` — filterStocks
- `src/lib/__tests__/scoring.test.ts` — wheel scoring parity tests
- `src/lib/__tests__/put-scoring.test.ts` — put scoring parity tests
- `src/lib/__tests__/filters.test.ts` — filter pipeline tests
