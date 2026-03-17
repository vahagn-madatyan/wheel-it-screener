# S02: State Management + API Services — Research

**Date:** 2026-03-12

## Summary

S02 is **already fully implemented**. All 6 Zustand stores, 3 typed API service clients (Finnhub, Alpaca, Massive.com), a token-bucket rate limiter, and TanStack Query v5 QueryClientProvider are wired and tested. 188 Vitest tests pass (including 33 store tests, 21 service tests, and 6 rate limiter tests). `tsc --noEmit` is clean.

The implementation follows all decisions from the register: Zustand v5 with persist middleware for apiKeyStore and themeStore (Decisions #1, #12), TanStack Query v5 with sensible defaults (Decision #2), typed service classes matching each API provider's auth and rate-limit patterns (Decision #6), and the `undefined`-instead-of-NaN convention for optional numeric filters (Decision #17).

This research confirms the slice delivers all three requirements (R006, R007, R008) with correct shapes, persistence behavior, and test coverage. No gaps found.

## Recommendation

**Proceed directly to planning.** The code exists and is verified. The plan should formalize the verification steps (tests pass, tsc clean, QueryClientProvider renders) and produce the slice summary.

If any behavioral gaps surface during downstream slices (S04 sidebar controls binding to stores, S05 scan flow using services), they should be addressed in those slices rather than reopening S02.

## Don't Hand-Roll

| Problem | Existing Solution | Why Use It |
|---------|------------------|------------|
| State management | Zustand v5 (`zustand@^5.0.11`) | Already installed, 6 stores written with correct shapes |
| Persist to localStorage | `zustand/middleware` `persist` | apiKeyStore and themeStore use it with `partialize` and `merge` |
| Server state / async | TanStack Query v5 (`@tanstack/react-query@^5.90.21`) | QueryClientProvider wired in main.tsx with staleTime 5min, retry 1 |
| API rate limiting | `TokenBucketRateLimiter` class | Token-bucket with configurable max/refill/interval, FIFO queue, dispose() for cleanup |

## Existing Code and Patterns

### Stores (`src/stores/`)

- `filter-store.ts` — FilterState + WeightConfig fields, `setFilter(key, value)`, `resetFilters()`, `applyPreset(name)`. Handles Preset string→number conversion for targetDTE/targetDelta. Defaults to finviz_cut2.
- `results-store.ts` — `allResults[]`, `filteredResults[]`, `sort: {key, direction}`. `setSortKey()` toggles direction on same key, resets to desc on new key.
- `scan-store.ts` — Phase-based state machine: `idle→running→complete|error`. `earningsMap: Map<string, string>` for earnings calendar data. `tickProgress()` increments scannedCount and derives progress ratio.
- `api-key-store.ts` — Persisted to `wheelscan-api-keys` in localStorage. Status derived (never serialized). `partialize` excludes actions and status. `merge` callback re-derives status on rehydrate.
- `theme-store.ts` — Persisted to `wheelscan-theme`. `applyThemeToDOM()` manages classList. `onRehydrateStorage` callback applies theme on page load.
- `chain-store.ts` — Holds `ChainData | null`, loading, error. `setSelectedExpiry()` is a no-op when chainData is null (safe).

### Services (`src/services/`)

- `finnhub.ts` — Class-based, token query param auth, accepts optional `TokenBucketRateLimiter`. Built-in 3-attempt retry with escalating backoff on 429. Methods: `getQuote`, `getMetrics`, `getEarningsCalendar`, `getProfile`, `getRecommendations`.
- `alpaca.ts` — Class-based, header auth (APCA-API-KEY-ID + APCA-API-SECRET-KEY). Two base URLs: data.alpaca.markets (snapshots) and paper-api.alpaca.markets (contracts/trading). `getAllOptionContracts()` handles pagination.
- `massive.ts` — Class-based, apiKey query param auth. Polygon.io API. `getAllOptionChainSnapshots()` follows `next_url` pagination. `requestUrl()` appends apiKey to paginated URLs.
- `api-error.ts` — Typed `ApiError extends Error` with `status`, `endpoint`, `responseBody` for downstream error handling (429 = rate limited, 401 = bad key).
- `rate-limiter.ts` — `TokenBucketRateLimiter(maxTokens, refillCount, refillIntervalMs)`. Configs documented: Finnhub (28, 28, 1000), Massive (5, 5, 60000). `dispose()` clears interval.

### Provider Wiring

- `main.tsx` — `QueryClient` with `staleTime: 5min`, `retry: 1`, `refetchOnWindowFocus: false`. Wraps `<App />` in `<QueryClientProvider>`.

## Constraints

- **Finnhub free tier**: 30 calls/sec hard limit. Rate limiter configured at 28 with 2-call buffer. Retry on 429 with 1200ms backoff × attempt number.
- **Massive.com free tier**: 5 calls/min. Rate limiter must use `(5, 5, 60000)`. The `MassiveService` does NOT have built-in retry on 429 (unlike FinnhubService) — if needed, add it downstream in S06.
- **Alpaca**: 200 req/min, generous enough that no rate limiter is attached. Auth via dual headers, not query params.
- **Zustand persist rehydration**: `apiKeyStore` and `themeStore` rehydrate on page load. Store state is available synchronously after initial render, but rehydrated values arrive asynchronously. `onRehydrateStorage` callback handles theme DOM sync.
- **Preset targetDTE/targetDelta type mismatch**: Preset interface uses `string` (select-bound), FilterState uses `number`. The `presetToFilterState()` function in filter-store.ts handles `parseInt`/`parseFloat` conversion — tested and verified.

## Common Pitfalls

- **Zustand v5 `create<T>()(...)` double-call syntax** — Required for TypeScript type inference with middleware. Missing the second `()` produces cryptic type errors. All stores already use this pattern correctly.
- **persist `partialize` vs `merge` coordination** — apiKeyStore `partialize` excludes `status`, and `merge` re-derives it. If new persisted fields are added later, both must be updated together or rehydration will lose data.
- **scanStore earningsMap as `Map`** — Zustand's default JSON serialization can't handle `Map`. This store is not persisted, so it's fine. If persistence is ever added, earningsMap would need a custom serializer.
- **TokenBucketRateLimiter timer leak** — `dispose()` must be called when services are torn down. Currently, service instances are created per-use (not singletons), so the limiter lifecycle needs management in the scan flow (S05). If a scan is cancelled mid-flight, the limiter's interval must be cleared.
- **AbortSignal threading** — All three service classes accept optional `AbortSignal` for scan cancellation. The scan flow (S05) must create an `AbortController` and pass `signal` to each service call. This is the mechanism for the cancel button.

## Open Risks

- **MassiveService lacks 429 retry logic** — FinnhubService retries 429 responses with backoff, but MassiveService does not. At 5 calls/min on free tier, 429s are likely during chain fetching. S06 should either add retry to the service or handle it at the call site.
- **No Finnhub option chain endpoint in FinnhubService** — The vanilla app uses Alpaca for option chains. The spec mentions Finnhub as a chain source, but FinnhubService only has quote/metric/profile/recommendation/earnings methods. If Finnhub option chain support is needed, a method must be added. This may be intentional — Finnhub's option chain API requires a premium plan.
- **Service instantiation pattern not yet established** — Stores hold API keys, but there's no factory or hook to create service instances with the current key + limiter. S05 will need to bridge `useApiKeyStore` → `new FinnhubService(key, limiter)`. This is a minor integration concern, not a blocker.

## Skills Discovered

| Technology | Skill | Status |
|------------|-------|--------|
| Zustand | `jezweb/claude-skills@zustand-state-management` (1.2K installs) | available — covers state management patterns |
| Zustand | `lobehub/lobehub@zustand` (611 installs) | available — lobehub-specific patterns |
| TanStack Query | `jezweb/claude-skills@tanstack-query` (2.5K installs) | available — general TQ patterns |
| TanStack Query | `deckardger/tanstack-agent-skills@tanstack-query-best-practices` (1.6K installs) | available — best practices focus |

None installed. The existing implementation is solid and follows standard patterns, so skills are optional. The `jezweb/claude-skills@zustand-state-management` and `deckardger/tanstack-agent-skills@tanstack-query-best-practices` skills could be useful for downstream slices (S04 store binding, S05 useMutation, S06 useQuery).

## Sources

- Zustand v5 persist middleware pattern: `create<T>()(persist(..., { name, partialize, merge }))` (source: [Zustand docs — Persisting Store Data](https://github.com/pmndrs/zustand/blob/main/docs/reference/integrations/persisting-store-data.md))
- TanStack Query v5 setup: `QueryClient` + `QueryClientProvider` + `useMutation`/`useQuery` hooks (source: [TanStack Query v5 Quick Start](https://tanstack.com/query/v5/docs/framework/react/quick-start))
- Finnhub API rate limit: 30 calls/sec on free tier, token-based auth via query param (source: vanilla `app.js` lines 243-278)
- Alpaca API auth: dual header auth (`APCA-API-KEY-ID` + `APCA-API-SECRET-KEY`), 200 req/min (source: vanilla `app.js` lines 923-950)
- Massive.com/Polygon API: `apiKey` query param, 5 calls/min free tier, `next_url` pagination (source: `IMPLEMENTATION_SPEC.md`)
