---
id: T02
parent: S02
milestone: M001
provides:
  - TokenBucketRateLimiter class with configurable (maxTokens, refillCount, refillIntervalMs) and async acquire()
  - ApiError class with status, endpoint, responseBody for typed error handling
  - FinnhubService with 5 typed methods, rate limiting, and 429 retry with backoff
  - AlpacaService with dual-endpoint (data + trading), header auth, and pagination
  - MassiveService with query-param auth, rate limiting, and next_url pagination
  - All services accept AbortSignal for scan cancellation
key_files:
  - src/services/rate-limiter.ts
  - src/services/api-error.ts
  - src/services/finnhub.ts
  - src/services/alpaca.ts
  - src/services/massive.ts
  - src/services/__tests__/rate-limiter.test.ts
  - src/services/__tests__/services.test.ts
key_decisions:
  - Rate limiter uses setInterval for refill + FIFO queue drain — simpler than setTimeout chains and handles concurrent waiters correctly
  - Finnhub retry uses multiplicative backoff (1200ms * attempt) and re-acquires rate limiter token after backoff to prevent post-retry bursts
  - AlpacaService.getOptionExpirations deduces expirations from contracts listing — no dedicated expirations endpoint needed
  - MassiveService.requestUrl handles next_url pagination by appending apiKey if not already present in the URL
patterns_established:
  - Service clients in src/services/ with one class per file, constructor takes (apiKey, rateLimiter?) or (keyId, secretKey)
  - All service methods accept optional AbortSignal as last param for cancellation support
  - ApiError thrown by all services — catch (err) { if (err instanceof ApiError) } for typed error handling downstream
  - Pagination helpers (getAllOptionContracts, getAllOptionChainSnapshots) follow cursor/next_url until exhausted
observability_surfaces:
  - ApiError.status exposes HTTP status (429 = rate limited, 401 = bad key, 403 = forbidden)
  - ApiError.endpoint identifies which API call failed for debugging
  - ApiError.responseBody preserves raw error body from provider
duration: 15m
verification_result: passed
completed_at: 2026-03-12
blocker_discovered: false
---

# T02: Build API service clients and token-bucket rate limiter

**Built typed FinnhubService, AlpacaService, MassiveService with rate limiting, retry, pagination, AbortSignal support, and TokenBucketRateLimiter class.**

## What Happened

Created 5 source files and 2 test files in `src/services/`. The TokenBucketRateLimiter uses setInterval-based refill with a FIFO queue for blocked callers — each refill cycle drains as many waiters as tokens available. FinnhubService wraps 5 Finnhub endpoints with query-param auth, optional rate limiter, and 429 retry (3 attempts, multiplicative 1200ms backoff). AlpacaService uses dual base URLs (data.alpaca.markets for snapshots, paper-api.alpaca.markets for contracts) with header auth and page_token pagination. MassiveService wraps Polygon API with query-param auth, optional rate limiter, and next_url pagination. ApiError class gives all services consistent typed errors with status, endpoint, and response body.

## Verification

- `npx vitest run src/services/__tests__/` — 27 tests pass (6 rate limiter + 21 service)
- `npx vitest run src/stores/__tests__/` — 33 tests pass (T01 stores still green)
- `npx tsc --noEmit` — zero errors
- `npm run dev` — dev server renders without console errors

All slice-level verification checks pass. This is the final task in S02.

## Diagnostics

- Catch `ApiError` to get structured error info: `err.status` (HTTP code), `err.endpoint` (path + params, never includes API key), `err.responseBody` (raw provider response)
- Rate limiter is a standalone class — instantiate with provider-specific config: `new TokenBucketRateLimiter(28, 28, 1000)` for Finnhub, `(5, 5, 60000)` for Massive
- Always call `dispose()` on rate limiter when done to prevent leaked intervals

## Deviations

- AlpacaService.getOptionExpirations simplified — removed unnecessary initial request, just paginates contracts and deduces unique expiration dates. Cleaner than the plan's separate endpoint approach.
- Added `src/services/api-error.ts` as separate file (plan listed it in step 2) — keeps error class importable without pulling in service implementations.

## Known Issues

None.

## Files Created/Modified

- `src/services/rate-limiter.ts` — TokenBucketRateLimiter with acquire/reset/dispose
- `src/services/api-error.ts` — ApiError class (status, endpoint, responseBody)
- `src/services/finnhub.ts` — FinnhubService with 5 methods + retry + rate limiting
- `src/services/alpaca.ts` — AlpacaService with dual-endpoint + pagination
- `src/services/massive.ts` — MassiveService with rate limiting + next_url pagination
- `src/services/__tests__/rate-limiter.test.ts` — 6 tests for token bucket behavior
- `src/services/__tests__/services.test.ts` — 21 tests for URL construction, auth, pagination, signals, errors
