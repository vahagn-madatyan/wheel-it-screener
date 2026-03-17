---
id: S02
parent: M001
milestone: M001
provides:
  - 6 Zustand stores with correct types, state transitions, and preset conversion
  - apiKeyStore and themeStore with versioned localStorage persistence
  - filterStore.applyPreset handles Preset→FilterState string→number conversion
  - TokenBucketRateLimiter class with configurable rates and async acquire()
  - FinnhubService with 5 methods, rate limiting, and 429 retry with backoff
  - AlpacaService with dual-endpoint (data + trading), header auth, pagination
  - MassiveService with query-param auth, rate limiting, and next_url pagination
  - ApiError class for consistent typed error handling across all services
  - All services accept AbortSignal for scan cancellation
  - QueryClientProvider wired at app root
requires:
  - slice: S01
    provides: TypeScript interfaces (StockResult, FilterState, etc.), PRESETS constant, DEFAULT_WEIGHTS
affects:
  - S04 (sidebar controls bind to filterStore, apiKeyStore, themeStore)
  - S05 (scan flow calls FinnhubService via scanStore)
  - S06 (chain modal calls MassiveService/FinnhubService via chainStore)
key_files:
  - src/stores/filter-store.ts
  - src/stores/results-store.ts
  - src/stores/scan-store.ts
  - src/stores/api-key-store.ts
  - src/stores/theme-store.ts
  - src/stores/chain-store.ts
  - src/services/rate-limiter.ts
  - src/services/api-error.ts
  - src/services/finnhub.ts
  - src/services/alpaca.ts
  - src/services/massive.ts
  - src/main.tsx
key_decisions:
  - "Decision #18: scanStore uses explicit phase enum (idle|running|complete|error) — clearer state machine"
  - "Decision #19: apiKeyStore derived status via deriveStatus() — never serialized, computed on mutation + rehydrate"
  - "Decision #20: Rate limiter uses setInterval + FIFO queue drain — handles concurrent waiters correctly"
  - "Decision #21: All services throw ApiError(message, status, endpoint, responseBody) — typed catch downstream"
  - "Decision #22: Finnhub 429 retry with multiplicative 1200ms backoff + re-acquire token to prevent post-retry bursts"
patterns_established:
  - Zustand stores in src/stores/ with one store per file, exported as useXxxStore hooks
  - Persist middleware with version:1 and partialize for excluding derived state
  - Service clients in src/services/ with one class per file, constructor takes (apiKey, rateLimiter?)
  - All service methods accept optional AbortSignal as last param
  - ApiError thrown by all services for typed error handling
observability_surfaces:
  - localStorage keys wheelscan-api-keys and wheelscan-theme inspectable in devtools
  - ApiError.status (429=rate limited, 401=bad key), ApiError.endpoint (no key leaked), ApiError.responseBody
  - filterStore console.warn on unknown preset names
drill_down_paths:
  - .gsd/milestones/M001/slices/S02/tasks/T01-SUMMARY.md
  - .gsd/milestones/M001/slices/S02/tasks/T02-SUMMARY.md
duration: 30m
verification_result: passed
completed_at: 2026-03-12
---

# S02: State Management + API Services

**Built 6 Zustand stores with persistence and typed Finnhub/Alpaca/Massive.com service clients with token-bucket rate limiting, all verified by 60 tests and tsc clean.**

## What Happened

**T01 — Stores + Query Provider (15m):** Installed zustand and @tanstack/react-query. Created all 6 stores matching the S01 type interfaces. filterStore defaults from PRESETS.finviz_cut2 with parseInt/parseFloat conversion for targetDTE/targetDelta. apiKeyStore uses persist middleware with partialize (excludes derived status) and recomputes status on every mutation and rehydrate. themeStore persists with DOM classList sync via onRehydrateStorage. scanStore uses an explicit phase enum (idle→running→complete/error). resultsStore tracks allResults/filteredResults with sort toggle. chainStore manages ChainData + loading/error. Wired QueryClientProvider in main.tsx with staleTime 5min, retry 1. Switched test environment to jsdom for localStorage/DOM access. 33 tests pass.

**T02 — Service Clients + Rate Limiter (15m):** Built TokenBucketRateLimiter with setInterval-based refill and FIFO queue for blocked callers. Created FinnhubService (5 endpoints, query-param auth, 429 retry with multiplicative 1200ms backoff), AlpacaService (dual base URLs, header auth, page_token pagination), and MassiveService (query-param auth, next_url pagination). Extracted ApiError class as separate module for clean imports. All services accept AbortSignal for cancellation. 27 tests pass covering URL construction, auth, pagination, signals, and error typing.

## Verification

- `npx vitest run src/stores/__tests__/` — **33 tests pass** (state transitions, persistence, preset conversion, DOM sync)
- `npx vitest run src/services/__tests__/` — **27 tests pass** (rate limiter throttling/FIFO/dispose, service URL/auth/pagination/AbortSignal/ApiError)
- `npx tsc --noEmit` — **zero errors**
- `npm run dev` — app renders at localhost:5173, no JS console errors, QueryClientProvider wired

## Requirements Advanced

- R008 — QueryClientProvider wired at app root. useMutation/useQuery hook usage deferred to S05/S06.

## Requirements Validated

- R006 — 33 tests prove all 6 store shapes, state transitions, persist serialization, preset conversion
- R007 — 27 tests prove rate limiter throttling, service client URL/auth construction, pagination, AbortSignal, ApiError typing

## New Requirements Surfaced

- none

## Requirements Invalidated or Re-scoped

- none

## Deviations

- Added `incrementCandidates()` action to scanStore — not in original plan, needed for scan flow to track candidate count independently of tickProgress
- Switched test environment from node to jsdom — required for localStorage and DOM classList tests
- AlpacaService.getOptionExpirations simplified — deduces expirations from contracts listing instead of separate endpoint
- ApiError extracted to separate file (`src/services/api-error.ts`) — keeps error class importable without pulling service implementations

## Known Limitations

- Services are tested with mocked fetch — no real API integration tests yet (S05/S06 scope)
- TanStack Query hooks (useMutation, useQuery) not exercised yet — only the provider is wired
- Rate limiter intervals must be manually disposed — no auto-cleanup on service destruction

## Follow-ups

- none

## Files Created/Modified

- `src/stores/filter-store.ts` — filterStore with presetToFilterState conversion
- `src/stores/results-store.ts` — resultsStore with sort toggle
- `src/stores/scan-store.ts` — scanStore with phase-based lifecycle
- `src/stores/api-key-store.ts` — apiKeyStore with persist + derived status
- `src/stores/theme-store.ts` — themeStore with persist + DOM sync
- `src/stores/chain-store.ts` — chainStore for option chain UI state
- `src/stores/__tests__/stores.test.ts` — 33 tests covering all stores
- `src/services/rate-limiter.ts` — TokenBucketRateLimiter with acquire/reset/dispose
- `src/services/api-error.ts` — ApiError class (status, endpoint, responseBody)
- `src/services/finnhub.ts` — FinnhubService with 5 methods + retry + rate limiting
- `src/services/alpaca.ts` — AlpacaService with dual-endpoint + pagination
- `src/services/massive.ts` — MassiveService with rate limiting + next_url pagination
- `src/services/__tests__/rate-limiter.test.ts` — 6 rate limiter tests
- `src/services/__tests__/services.test.ts` — 21 service client tests
- `src/main.tsx` — wrapped App in QueryClientProvider
- `vite.config.ts` — switched test environment to jsdom
- `package.json` — added zustand, @tanstack/react-query, jsdom, @testing-library/jest-dom

## Forward Intelligence

### What the next slice should know
- Stores export as `useFilterStore`, `useApiKeyStore`, `useScanStore`, `useResultsStore`, `useThemeStore`, `useChainStore` — all standard Zustand hooks
- filterStore.applyPreset('conservative') produces numeric targetDTE/targetDelta — safe to bind directly to number inputs
- apiKeyStore.status is derived (not stored) — always call getState() for fresh status, don't cache it

### What's fragile
- Rate limiter dispose() must be called when done — leaked setInterval will keep Node process alive in tests. Service classes don't auto-dispose their rate limiters.
- themeStore DOM sync relies on document.documentElement.classList — will throw in SSR or non-browser environments (fine for this SPA, but don't import in Node test files without jsdom)

### Authoritative diagnostics
- `localStorage.getItem('wheelscan-api-keys')` — shows persisted API key state (keys present, never the actual values in logs)
- `ApiError.endpoint` on catch — identifies exactly which API call failed without leaking keys
- Store `getState()` from browser console — Zustand stores expose full state for devtools debugging

### What assumptions changed
- AlpacaService doesn't need a dedicated expirations endpoint — deducing from contracts list is cleaner and one fewer API call
