---
estimated_steps: 5
estimated_files: 4
---

# T01: Build scan orchestrator and progress UI

**Slice:** S05 — Results + Scan Flow
**Milestone:** M001

## Description

Build the core scan pipeline as a pure async function (`runScan`) decoupled from React, then wrap it in a `useScanRunner` hook using TanStack `useMutation`. This is the highest-risk piece — a 5-phase sequential pipeline that must coordinate FinnhubService calls, rate limiting, abort handling, and store updates without stale closures or leaked intervals.

## Steps

1. **Create `src/lib/scan.ts`** — Pure async `runScan()` function. Parameters: `{ tickers, finnhubKey, filters, signal, onTick, onCandidateFound, onPhaseChange }`. No store imports — all side effects via callbacks. Pipeline:
   - Phase 1: Earnings calendar (single call, `from=today`, `to=today+120d`). Build earningsMap: `Record<string, EarningsEntry>` keeping nearest date per symbol. Non-fatal on failure (warn, continue with empty map).
   - Phase 2: Per ticker — `Promise.all([getQuote, getMetrics])`. Build StockResult from response, apply early price filter. Call `onTick(ticker)` after each. Call `onCandidateFound()` for those passing price filter.
   - Phase 3: Profile enrichment for candidates — `getProfile()` per candidate. Update name, industry, exchange, marketCap. Non-fatal per ticker.
   - Phase 4: Analyst recommendations — `getRecommendations()` per candidate. Compute analystBuy/Hold/Sell/BuyPct. Non-fatal per ticker.
   - Phase 5: Call `filterStocks(candidates, filters, earningsMap)`. Return `{ allResults: candidates, filteredResults }`.
   - Create `FinnhubService` and `TokenBucketRateLimiter` internally. Dispose rate limiter in `finally` block.
   - Check `signal.aborted` between phases to exit early.

2. **Create `src/hooks/use-scan-runner.ts`** — Custom hook returning `{ runScan, cancel, phase, progress, currentTicker, error }`. Internals:
   - `AbortController` stored in `useRef`, created fresh per run.
   - Snapshot filter state and Finnhub key at mutation call time (not from closures).
   - `useMutation` from TanStack — `mutationFn` calls `runScan()`, `onMutate` → `scanStore.startScan(tickers.length)`, `onSuccess` → `resultsStore.setResults()` + `scanStore.completeScan()`, `onError` → detect `AbortError` name and call `resetScan()` vs `failScan(message)`.
   - `cancel()` calls `abortController.current?.abort()`.
   - Expose store-derived state for components.

3. **Build `src/components/main/ProgressBar.tsx`** — Reads `useScanStore`. Shows: phase label, progress bar with percentage fill, current ticker name. Visible only when `phase === 'running'`. Error message when `phase === 'error'`. Minimal styling (full polish in S07).

4. **Update `src/components/sidebar/ActionButtons.tsx`** — Import `useScanRunner`. Wire Run button `onClick` → `runScan()`. Show "Cancel" button when `phase === 'running'` that calls `cancel()`. Keep disabled logic (no Finnhub key).

5. **Type-check and verify** — `npx tsc --noEmit`, dev server renders, button states are correct.

## Must-Haves

- [ ] `runScan()` is a pure async function — no store imports, all side effects via callbacks
- [ ] 5-phase pipeline matches vanilla scan order exactly
- [ ] AbortController signal passed to every FinnhubService call
- [ ] TokenBucketRateLimiter created per scan, disposed in finally block
- [ ] AbortError detected by name and treated as cancel (resetScan), not failure (failScan)
- [ ] Filter state and API key snapshotted at mutation call time, not read from hook closures
- [ ] Cancel button visible during scan, triggers abort
- [ ] Progress bar shows percentage and current ticker during scan

## Verification

- `npx tsc --noEmit` — zero errors
- Dev server starts and renders without JS errors
- Run button disabled without Finnhub key, enabled with key
- Cancel button appears during scan phase
- Code review: `runScan()` has no store imports, AbortController lifecycle correct, rate limiter disposed in finally

## Observability Impact

- Signals added: scanStore phase transitions driven by useScanRunner callbacks — idle→running→complete/error
- How a future agent inspects: `useScanStore.getState()` shows phase, progress, currentTicker, error, scannedCount, candidateCount
- Failure state exposed: scanStore.error set on API failure with descriptive message; first 401/403 surfaces as "Invalid Finnhub API key" text

## Inputs

- `src/services/finnhub.ts` — FinnhubService with 5 API methods, all accepting AbortSignal
- `src/services/rate-limiter.ts` — TokenBucketRateLimiter with dispose()
- `src/stores/scan-store.ts` — Phase state machine with all lifecycle actions
- `src/stores/results-store.ts` — setResults(all, filtered)
- `src/stores/filter-store.ts` — getState() for filter snapshot
- `src/stores/api-key-store.ts` — getState() for Finnhub key
- `src/lib/filters.ts` — filterStocks(candidates, filters, earningsMap)
- `src/lib/utils.ts` — getTickerList(filters)
- `src/components/sidebar/ActionButtons.tsx` — existing button with disabled logic

## Expected Output

- `src/lib/scan.ts` — Pure async scan orchestrator, decoupled from React
- `src/hooks/use-scan-runner.ts` — useMutation hook bridging scan function to stores
- `src/components/main/ProgressBar.tsx` — Progress bar component
- `src/components/sidebar/ActionButtons.tsx` — Updated with scan trigger and cancel
