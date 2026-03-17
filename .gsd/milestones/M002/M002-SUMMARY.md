# M002 Summary — PR Review Fixes

**Milestone:** M002: PR Review Fixes — Correctness, Resilience & Cleanup
**Status:** Complete
**Date:** 2026-03-16
**Tests:** 222 → 227 (net +5)

## What Changed

### Critical Fixes (S01)
- **Market cap unit mismatch fixed.** Finnhub returns `marketCapitalization` in millions; code now multiplies by 1e6 at ingestion to normalize to raw dollars. Filter (`/1e9` for billions) and CSV export now work correctly.
- **Chain OI empty catch replaced.** Now propagates abort signals and auth errors (401/403), logs non-fatal failures with symbol context via `console.warn`.
- **API keys moved to sessionStorage.** Zustand persist middleware now uses sessionStorage (version bumped to 2). Keys survive page refresh but are cleared when the browser closes. Info banner added to API Keys sidebar section.

### Error Visibility (S02)
- **Failed tickers tracked and surfaced.** `ScanResult` now includes `failedTickers: string[]`. ScanWarnings component shows count + first 5 ticker names after scan completion.
- **Earnings warning surfaced.** When earnings calendar fetch fails, a user-visible warning appears ("Earnings data unavailable — earnings filter may be incomplete").
- **Scan phase labels wired.** ProgressBar now shows phase-specific labels ("Loading earnings calendar…", "Scanning stocks…", etc.) during each scan phase.

### Type Safety & Resilience (S03)
- **ChainParams discriminated union.** Replaced optional fields + `!` assertions with `AlpacaChainParams | MassiveChainParams`. Zero non-null assertions remain. Service instantiated once per branch (also fixes recommendation #12 — duplicate instantiation).
- **computeWheelScore zero-weight guard.** Returns 0 (not NaN) when all four weights are 0.
- **React Error Boundary.** Wraps entire app in main.tsx. Shows recovery UI with "Try again" button.
- **Suspense fallback improved.** ChainModal chunk load failure now shows a loading overlay instead of `null`.

### Hook Cleanup (S04)
- **useChainQuery queryKey fixed.** Now includes `currentPrice`, `targetDTE`, `targetDelta` — stale cache no longer served when these change.
- **ScoringWeightsSection callback fixed.** Replaced curried `useCallback` with direct `(key, value)` signature so memoization actually works.

### Dead Code & Coverage (S05)
- **Dead `ScanProgress` type removed** from types/index.ts (never imported).
- **Stale JSDoc fixed** on `FilterState.targetDTE` and `targetDelta`.
- **`minPremium` filter implemented.** The field existed in UI/presets but `filterStocks()` never checked it. Now filters on `premiumYield >= minPremium`.
- **`tickerUniverse` narrowed** to `TickerUniverse` union type (`'wheel_popular' | 'sp500_top' | 'high_dividend' | 'custom'`). Silent fallback removed — invalid values caught at compile time.
- **3 dispatcher tests** added for `fetchChain` (Alpaca routing, Massive routing, no-expiry error).
- **1 zero-weight scoring test** added for `computeWheelScore`.
- **2 minPremium filter tests** added.

## Files Changed (19)
- `src/lib/scan.ts` — market cap normalization, failedTickers tracking, earningsWarning
- `src/lib/chain.ts` — OI catch fix, discriminated union, single service instantiation
- `src/lib/filters.ts` — minPremium filter implementation
- `src/lib/scoring.ts` — zero-weight guard
- `src/lib/utils.ts` — TickerUniverse type
- `src/lib/constants.ts` — typed TICKER_LISTS
- `src/types/index.ts` — TickerUniverse type, dead ScanProgress removed, JSDoc fixed
- `src/stores/api-key-store.ts` — sessionStorage, version 2
- `src/stores/scan-store.ts` — phaseLabel, failedTickers, earningsWarning
- `src/hooks/use-scan-runner.ts` — phase label wiring, failedTickers forwarding
- `src/hooks/use-chain-query.ts` — queryKey deps, discriminated params
- `src/components/ErrorBoundary.tsx` — new
- `src/components/main/ScanWarnings.tsx` — new
- `src/components/main/ProgressBar.tsx` — phase label display
- `src/components/sidebar/ApiKeysSection.tsx` — session storage info banner
- `src/components/sidebar/StockFiltersSection.tsx` — TickerUniverse cast
- `src/components/sidebar/ScoringWeightsSection.tsx` — non-curried callback
- `src/main.tsx` — ErrorBoundary wrapper
- `src/App.tsx` — ScanWarnings, Suspense fallback
- `.prettierignore` — RECOMMENDATIONS.md excluded

## Verification
- 227 Vitest tests pass (12 files, 0 failures)
- `tsc --noEmit` clean
- `eslint .` clean (0 errors, 1 pre-existing warning)
- `prettier --check .` clean
- `npm run build` succeeds (530KB main + 33KB ChainModal chunks)
