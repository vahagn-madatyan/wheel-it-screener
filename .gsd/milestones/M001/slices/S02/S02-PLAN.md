# S02: State Management + API Services

**Goal:** All client state managed by Zustand stores with correct shapes and persistence, typed API service clients with rate limiting ready for scan/chain flows, TanStack Query provider wired at app root.
**Demo:** Vitest tests prove store shapes, state transitions, preset-to-filter conversion, localStorage persistence, token-bucket rate limiting, and service client URL/auth construction. Dev server renders with QueryClientProvider without errors.

## Must-Haves

- 6 Zustand stores: filterStore, resultsStore, scanStore, apiKeyStore (persist), themeStore (persist), chainStore
- apiKeyStore and themeStore persist to localStorage with versioned schemas
- filterStore.applyPreset correctly converts Preset string fields (targetDTE, targetDelta) to FilterState numbers
- TokenBucketRateLimiter class: configurable maxTokens/refillCount/refillIntervalMs, async acquire() that awaits when exhausted
- FinnhubService: typed methods for quote, metrics, earnings calendar, profile, recommendations with rate limiting
- AlpacaService: dual-endpoint (data + trading) with header auth, pagination support
- MassiveService (Polygon): typed methods for option chain snapshot + contracts with rate limiting
- TanStack Query v5 QueryClientProvider wired in main.tsx
- All services accept AbortSignal for scan cancellation (R019 prep)

## Proof Level

- This slice proves: contract (store shapes + service interfaces consumed by S04-S06)
- Real runtime required: no (stores and services testable in isolation)
- Human/UAT required: no

## Verification

- `npx vitest run src/stores/__tests__/` — all store tests pass (state transitions, persistence, preset conversion)
- `npx vitest run src/services/__tests__/` — rate limiter and service client tests pass
- `npx tsc --noEmit` — zero TypeScript errors
- `npm run dev` — dev server starts, app renders without console errors (QueryClientProvider wired)

## Observability / Diagnostics

- Runtime signals: none yet (stores are client state, services aren't called until S05/S06)
- Inspection surfaces: localStorage keys `wheelscan-api-keys` and `wheelscan-theme` inspectable in browser devtools
- Failure visibility: service clients throw typed errors with status code, endpoint, and message
- Redaction constraints: API keys stored in localStorage — service clients never log key values, only key presence

## Integration Closure

- Upstream surfaces consumed: `src/types/index.ts` (all 8 interfaces), `src/lib/constants.ts` (PRESETS, DEFAULT_WEIGHTS)
- New wiring introduced in this slice: QueryClientProvider in main.tsx, zustand stores importable from `@/stores/*`
- What remains before the milestone is truly usable end-to-end: S03 (layout), S04 (controls wired to stores), S05 (scan flow calls services), S06 (chain modal), S07 (polish), S08 (cleanup)

## Tasks

- [x] **T01: Build Zustand stores and wire TanStack Query provider** `est:40m`
  - Why: Establishes all client state shapes that S04 sidebar controls will bind to. apiKeyStore and themeStore must persist to localStorage. filterStore.applyPreset must handle the Preset→FilterState type conversion (string→number for targetDTE/targetDelta). QueryClientProvider must be at app root for S05/S06 hooks.
  - Files: `src/stores/filter-store.ts`, `src/stores/results-store.ts`, `src/stores/scan-store.ts`, `src/stores/api-key-store.ts`, `src/stores/theme-store.ts`, `src/stores/chain-store.ts`, `src/main.tsx`, `src/stores/__tests__/stores.test.ts`
  - Do: Install zustand + @tanstack/react-query. Create 6 stores matching shapes from research. apiKeyStore uses persist middleware with version:1, partialize to exclude `status` (derived). themeStore persists with version:1. filterStore defaults to finviz_cut2 values (parsed), applyPreset does parseInt/parseFloat on targetDTE/targetDelta. scanStore tracks ScanProgress + earningsMap. resultsStore holds allResults/filteredResults/sort. chainStore holds ChainData + loading/error. Wire QueryClientProvider in main.tsx.
  - Verify: `npx vitest run src/stores/__tests__/` passes; `npx tsc --noEmit` clean; dev server renders
  - Done when: All 6 stores importable with correct types, persist stores serialize/deserialize correctly, applyPreset produces numeric targetDTE/targetDelta, QueryClientProvider renders without errors

- [x] **T02: Build API service clients and token-bucket rate limiter** `est:35m`
  - Why: Typed fetch wrappers that S05 (scan flow) and S06 (chain modal) will call. Rate limiter is critical — Finnhub at 28/sec and Massive.com at 5/min need different bucket configs. All services must accept AbortSignal for scan cancellation support.
  - Files: `src/services/rate-limiter.ts`, `src/services/finnhub.ts`, `src/services/alpaca.ts`, `src/services/massive.ts`, `src/services/__tests__/rate-limiter.test.ts`, `src/services/__tests__/services.test.ts`
  - Do: Build TokenBucketRateLimiter with configurable (maxTokens, refillCount, refillIntervalMs), async acquire() that resolves a promise on next refill when exhausted, reset() method. Build FinnhubService class taking (apiKey, rateLimiter?) — methods: getQuote, getMetrics, getEarningsCalendar, getProfile, getRecommendations. Each calls acquire() before fetch, passes AbortSignal, retries on 429. Build AlpacaService with dual base URLs, header auth, pagination helper. Build MassiveService with query-param auth, pagination via next_url. All services throw typed ApiError with status/endpoint/message.
  - Verify: `npx vitest run src/services/__tests__/` passes; `npx tsc --noEmit` clean
  - Done when: Rate limiter correctly throttles concurrent calls (proven by fake-timer tests), all three service clients construct correct URLs and auth, AbortSignal cancellation works, ApiError typing is consistent

## Files Likely Touched

- `package.json` — add zustand, @tanstack/react-query
- `src/main.tsx` — wrap App in QueryClientProvider
- `src/stores/filter-store.ts` — filterStore with applyPreset
- `src/stores/results-store.ts` — resultsStore with sort
- `src/stores/scan-store.ts` — scanStore with progress
- `src/stores/api-key-store.ts` — apiKeyStore with persist
- `src/stores/theme-store.ts` — themeStore with persist
- `src/stores/chain-store.ts` — chainStore
- `src/stores/__tests__/stores.test.ts` — store tests
- `src/services/rate-limiter.ts` — TokenBucketRateLimiter
- `src/services/finnhub.ts` — FinnhubService
- `src/services/alpaca.ts` — AlpacaService
- `src/services/massive.ts` — MassiveService
- `src/services/__tests__/rate-limiter.test.ts` — rate limiter tests
- `src/services/__tests__/services.test.ts` — service client tests
