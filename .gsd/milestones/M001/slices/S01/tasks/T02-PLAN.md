---
estimated_steps: 4
estimated_files: 6
---

# T02: Define TypeScript interfaces, extract constants, formatters, and utilities

**Slice:** S01 — Foundation + Business Logic
**Milestone:** M001

## Description

Define all domain TypeScript interfaces that downstream slices consume (stores, services, components). Extract the low-risk pure functions and constants from `app.js`: ticker lists, presets, excluded sectors/tickers, formatters (formatNum, formatMktCap, escapeHtml, truncate), and utilities (parseStrikeFromSymbol, isExcludedSector, getTickerList). Write unit tests for each. This establishes the module pattern and proves the test infrastructure works before tackling the high-risk scoring extraction in T03.

## Steps

1. Create `src/types/index.ts` with all domain interfaces:
   - `StockResult` — every field from vanilla app.js stock objects (symbol, name, price, marketCap, avgVolume, pe, beta, dividendYield, fiftyTwoWeekHigh/Low, twoHundredDayAvg, industry, exchange, debtToEquity, netMargin, revenueGrowth, roe, analystBuy/Hold/Sell/BuyPct, earningsDays, earningsDate, buyingPower, ivRank, premiumYield, sma200Status, sma200Pct, premiumScore, liquidityScore, stabilityScore, fundamentalsScore, wheelScore). Nullable fields use `number | null`, NaN-sentinel fields from filters use `number | undefined`.
   - `PutOption` — strike, bid, ask, mid, spread, spreadPct, volume, oi, delta, iv, last, premYield, itm, dte, putScore, rec, spreadScore, liquidityScore, premScore, deltaScore, ivScore
   - `FilterState` — all filter fields matching getFilters() return shape, with `number | undefined` for NaN-sentinel fields (maxDebtEquity, minNetMargin, minSalesGrowth, minROE), booleans for toggles, string for tickerUniverse/customTickers, `WeightConfig` for weights
   - `WeightConfig` — weightPremium, weightLiquidity, weightStability, weightFundamentals (all number)
   - `Preset` — record matching PRESETS shape (filter values + toggle booleans + weight values)
   - `ScanProgress` — running, progress (0-1), currentTicker, scannedCount, totalCount, candidateCount, error
   - `ChainData` — symbol, expirations, selectedExpiry, puts
   - `ApiKeys` — finnhubKey, alpacaKeyId, alpacaSecretKey, massiveKey, with status per key
2. Create `src/lib/constants.ts` — export typed `TICKER_LISTS`, `PRESETS`, `EXCLUDED_INDUSTRIES`, `EXCLUDED_TICKERS`, and `DEFAULT_WEIGHTS` constants. Ensure PRESETS values match vanilla app.js exactly (including string types for targetDTE/targetDelta select-bound values).
3. Create `src/lib/formatters.ts` (formatNum, formatMktCap, escapeHtml — string-based replace chain for `<>&"'`, truncate) and `src/lib/utils.ts` (parseStrikeFromSymbol, isExcludedSector, getTickerList). All pure functions with typed signatures.
4. Create `src/lib/__tests__/formatters.test.ts` and `src/lib/__tests__/utils.test.ts` with test cases:
   - formatNum: normal numbers, null/undefined/NaN → "—", locale grouping for large numbers, various decimal counts
   - formatMktCap: trillions, billions, millions, zero, negative
   - escapeHtml: all 5 characters, empty string, no-op strings
   - truncate: under limit, at limit, over limit, empty
   - parseStrikeFromSymbol: valid OCC symbol, malformed, edge cases
   - isExcludedSector: excluded industry (case-insensitive), excluded ticker (case-insensitive), clean stock, null inputs
   - getTickerList: each universe, custom tickers deduped + uppercased + length-capped, combined

## Must-Haves

- [ ] All 8 domain interfaces defined and importable via `@/types`
- [ ] TICKER_LISTS, PRESETS, EXCLUDED_INDUSTRIES, EXCLUDED_TICKERS match vanilla app.js exactly
- [ ] formatNum, formatMktCap, escapeHtml, truncate produce identical outputs to vanilla functions
- [ ] parseStrikeFromSymbol, isExcludedSector, getTickerList produce identical outputs to vanilla functions
- [ ] All formatter and utility tests pass

## Verification

- `npx vitest run` — all formatter and utility tests pass
- `npx tsc --noEmit` — zero errors (interfaces are well-formed)

## Inputs

- `vite.config.ts`, `tsconfig.json` — from T01 (path aliases, Vitest config)
- `app.js` — source of truth for constants, formatters, utility logic

## Expected Output

- `src/types/index.ts` — all domain interfaces
- `src/lib/constants.ts` — typed constants
- `src/lib/formatters.ts` — pure formatter functions
- `src/lib/utils.ts` — pure utility functions (OCC parser, sector exclusion, ticker list builder)
- `src/lib/__tests__/formatters.test.ts` — formatter test suite
- `src/lib/__tests__/utils.test.ts` — utility test suite
