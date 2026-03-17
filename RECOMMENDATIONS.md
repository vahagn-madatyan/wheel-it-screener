# PR Review Recommendations — PR #2 (`gsd/M001/S08`)

**Review Date:** 2026-03-16
**Scope:** 82 files changed | +4601 / -1797 | React/TypeScript stock screener

---

## Critical Issues (3)

### 1. API keys stored in plaintext localStorage

- **Location:** `src/stores/api-key-store.ts:68-76`
- **Issue:** The `persist` middleware stores `finnhubKey`, `alpacaKeyId`, `alpacaSecretKey`, and `massiveKey` as plaintext strings in `localStorage` under `wheelscan-api-keys`. Any XSS vulnerability, browser extension, or shared machine access exposes all credentials. The Alpaca secret key can authorize real financial trades.
- **Recommendation:** At minimum encrypt keys at rest using `crypto.subtle.encrypt`, or use `sessionStorage` so keys don't persist across sessions. Add a UI warning that keys are stored locally. For production, a backend proxy holding keys server-side is the proper solution.

### 2. Empty catch block swallows all errors during OI fetch

- **Location:** `src/lib/chain.ts:144-146`
- **Issue:** The catch block is completely empty — no logging, no auth check, no abort signal check. Silently swallows network failures, 401/403 auth errors, server errors, and abort signals. User sees `OI: 0` for every contract with no indication of failure.
- **Recommendation:**
  ```typescript
  } catch (err) {
    if (signal?.aborted) throw err;
    if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
      throw err;
    }
    console.warn(
      `[chain] OI fetch failed for ${symbol}, continuing without OI:`,
      err instanceof Error ? err.message : err,
    );
  }
  ```

### 3. Market cap filter unit mismatch

- **Location:** `src/lib/filters.ts:31-33` vs `src/lib/scan.ts:59`
- **Issue:** Finnhub returns `marketCapitalization` in **millions** (per Finnhub docs), but the filter divides by `1e9` assuming raw dollars. This makes the market cap filter effectively never exclude anything. The `formatMktCap` function in `formatters.ts` also assumes raw dollars.
- **Recommendation:** Verify Finnhub's unit and either convert at ingestion time in `buildStockResult` (multiply by `1e6` to get raw dollars) or fix the filter math to divide by `1e3` instead of `1e9`.

---

## Important Issues (8)

### 4. `ChainParams` uses 6 non-null assertions on optional API keys

- **Location:** `src/lib/chain.ts:14-27, 275-278, 283-284, 310-312, 324`
- **Issue:** `ChainParams` declares auth fields as optional (`string?`) but uses them with `!` assertions. If called with the wrong provider/key combination, `undefined` passes silently as a string.
- **Recommendation:** Refactor to discriminated union:
  ```typescript
  type ChainParams = {
    symbol: string;
    currentPrice: number;
    targetDTE: number;
    targetDelta: number;
    signal?: AbortSignal;
  } & (
    | { provider: 'alpaca'; alpacaKeyId: string; alpacaSecretKey: string }
    | { provider: 'massive'; massiveKey: string; massiveRateLimiter?: TokenBucketRateLimiter }
  );
  ```

### 5. `useChainQuery` queryKey missing dependencies

- **Location:** `src/hooks/use-chain-query.ts:58`
- **Issue:** `currentPrice`, `targetDTE`, and `targetDelta` are used inside `queryFn` but not included in `queryKey` (`['chain', symbol, provider]`). If any of these values change, TanStack Query returns stale cached data.
- **Recommendation:**
  ```typescript
  queryKey: ['chain', symbol, provider, currentPrice, targetDTE, targetDelta] as const,
  ```

### 6. Earnings calendar failure silently disables earnings filter

- **Location:** `src/lib/scan.ts:135-141`
- **Issue:** When the earnings API call fails, the scan continues with an empty earnings map. The `excludeEarnings` filter depends on this data, so no stocks get excluded. User trusts the filter but it's silently inactive. Additionally, abort signals and auth errors are swallowed.
- **Recommendation:** Propagate abort and auth errors. Surface partial data warning to the user (e.g., "Earnings data unavailable — earnings filter may be incomplete").

### 7. Per-ticker API errors silently drop stocks

- **Location:** `src/lib/scan.ts:169-182, 203-209, 234-240`
- **Issue:** When a quote/metrics call fails for a ticker (non-auth errors), the stock is silently dropped. User has no way to know which stocks were skipped or why. They may make investment decisions based on an incomplete dataset.
- **Recommendation:** Track failed tickers and surface count in the UI:
  ```typescript
  export interface ScanResult {
    allResults: StockResult[];
    filteredResults: StockResult[];
    failedTickers: string[];
  }
  ```
  UI: "30 results (15 tickers failed to load)"

### 8. Division by zero when all weights are 0

- **Location:** `src/lib/scoring.ts:88-92, 155-161`
- **Issue:** `computeWheelScore` sums all weights as `totalWeight` and divides by it. If all four weights are 0 (which the slider UI allows), this produces `NaN` for all scores. The `ScoreTooltip` guards against this but the core function does not.
- **Recommendation:**
  ```typescript
  result.wheelScore = totalWeight > 0
    ? Math.round((...) / totalWeight)
    : 0;
  ```

### 9. `onPhaseChange` is a no-op — scan phases never displayed

- **Location:** `src/hooks/use-scan-runner.ts:47-49`
- **Issue:** `PHASE_LABELS` is defined (lines 12-18) with labels like "Loading earnings calendar...", "Scanning stocks..." but never shown. The callback is an empty function. During long scans, the progress bar stalls at 100% during enrichment phases because the counter already reached total during Phase 2.
- **Recommendation:** Wire `onPhaseChange` to the scan store and display the current phase label in the ProgressBar.

### 10. No tests for `runScan()` orchestrator

- **Location:** `src/lib/scan.ts`
- **Issue:** The primary entry point for the entire scan pipeline has zero test coverage. Key untested behaviors: `buildStockResult()` field mapping (24+ fields with `??` fallbacks), auth error detection, early price filter, abort signal propagation, per-ticker error handling, rate limiter cleanup.
- **Recommendation:** Add integration-style tests with mocked services. The function takes callbacks (not stores), making it straightforward to test.

### 11. No tests for `fetchChain()` dispatcher

- **Location:** `src/lib/chain.ts:265-350`
- **Issue:** Individual functions (`fetchChainAlpaca`, `selectBestExpiry`, `detectChainProvider`) are well-tested, but the dispatcher that ties them together is not. Missing coverage for provider routing, error handling, and `scorePuts` integration.
- **Recommendation:** Add tests for the dispatcher with mocked service calls.

---

## Suggestions (10)

### 12. Duplicate service instantiation

- **Location:** `src/lib/chain.ts:274-278, 310-312`
- **Issue:** `AlpacaService`/`MassiveService` are instantiated twice per `fetchChain` call — once for expirations, once for chain data.
- **Recommendation:** Create the service once at the top of the provider branch and reuse it.

### 13. `StockFiltersSection` subscribes to entire filter store

- **Location:** `src/components/sidebar/StockFiltersSection.tsx:77`
- **Issue:** `const state = useFilterStore()` subscribes to all ~25+ fields. Any filter change re-renders this component even if it only uses ~12 fields.
- **Recommendation:** Use `useShallow` with a selector picking only needed fields, consistent with patterns elsewhere in the codebase.

### 14. `ScoringWeightsSection` currying defeats `useCallback`

- **Location:** `src/components/sidebar/ScoringWeightsSection.tsx:113-128`
- **Issue:** `handleWeightChange` is wrapped in `useCallback` but returns a new function per weight key on every render via currying, defeating memoization.
- **Recommendation:** Accept both `key` and `value` as parameters in a single callback.

### 15. No React Error Boundary

- **Location:** `src/App.tsx`, `src/main.tsx`
- **Issue:** No Error Boundary in the component tree. Any unhandled render error white-screens the entire app with no recovery path.
- **Recommendation:** Add a top-level Error Boundary with a user-friendly recovery message.

### 16. Dead type `ScanProgress`

- **Location:** `src/types/index.ts:156-165`
- **Issue:** Defined but never imported or used. The scan store has its own superior model with `ScanPhase`.
- **Recommendation:** Remove the dead type.

### 17. Stale JSDoc on `FilterState`

- **Location:** `src/types/index.ts:31,33`
- **Issue:** Comments say "Select-bound string value" but the types are `number`. The comments describe the `Preset` type, not `FilterState`.
- **Recommendation:** Fix or remove the stale comments.

### 18. `tickerUniverse: string` too broad

- **Location:** `src/types/index.ts:27`
- **Issue:** Should be a union of known keys (`'wheel_popular' | 'sp500_top' | 'high_dividend' | 'custom'`). The runtime silently falls back to `wheel_popular` for unknown keys at `src/lib/utils.ts:50-54`, hiding bugs.
- **Recommendation:** Narrow to a union literal type and remove the silent fallback (or add a warning log).

### 19. `minPremium` field is dead code or missing filter

- **Location:** `src/lib/filters.ts`
- **Issue:** `FilterState` includes `minPremium` (default 8) but `filterStocks()` never references it. Either a dead field or a missing filter implementation.
- **Recommendation:** Investigate and either implement the filter or remove the field.

### 20. `currentPrice` defaulting to 0 degrades chain data

- **Location:** `src/hooks/use-chain-query.ts:35-39`
- **Issue:** When symbol is not in results, `currentPrice` defaults to 0. With price 0, all puts appear OTM (`itm = currentPrice > 0 && strike >= currentPrice`), and scoring treats them as valid candidates including deep ITM puts.
- **Recommendation:** Throw an error or show a warning when `currentPrice` is 0.

### 21. `Suspense fallback={null}` hides lazy-load failures

- **Location:** `src/App.tsx:67`
- **Issue:** If the ChainModal chunk fails to load (network error, CDN failure), nothing is shown. Without an Error Boundary wrapping it, the error propagates and crashes the app.
- **Recommendation:** Wrap in an Error Boundary or provide a meaningful fallback.

---

## Strengths

- **222 tests passing** with zero failures; strong edge case coverage for business logic
- **Excellent immutability testing** — most pure-function tests verify inputs are not mutated
- **Well-structured `ApiError` class** with status, endpoint, and responseBody
- **Good abort signal threading** through all service calls
- **Rate limiter with proper cleanup** in `finally` blocks
- **Clean store encapsulation** — `ScanStore` uses transition methods instead of raw setters
- **No `any` usage** in production code
- **Good factory patterns** in tests (`makeStock()`, `makePut()`, etc.)
- **Comprehensive weight redistribution tests** covering all edge cases
- **Service tests verify HTTP-level contracts** including URL construction, headers, pagination, and 429 retry with fake timers

---

## Action Plan

### Phase 1 — Fix Critical Issues
1. Verify Finnhub market cap units and fix filter math
2. Add logging + abort/auth propagation to empty catch in `chain.ts:144`
3. Consider `sessionStorage` or encryption for API keys

### Phase 2 — Address Correctness Bugs
4. Add missing deps to `useChainQuery` queryKey
5. Guard `computeWheelScore` against `totalWeight === 0`
6. Refactor `ChainParams` to discriminated union

### Phase 3 — Improve User Feedback
7. Wire `onPhaseChange` to scan store for progress visibility
8. Surface failed ticker count and partial data warnings

### Phase 4 — Follow-up
9. Add tests for `runScan()` and `fetchChain()`
10. Add React Error Boundary
11. Clean up dead type, stale JSDoc, dead `minPremium` field
