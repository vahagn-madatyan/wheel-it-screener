---
estimated_steps: 5
estimated_files: 7
---

# T02: Build API service clients and token-bucket rate limiter

**Slice:** S02 — State Management + API Services
**Milestone:** M001

## Description

Build the async infrastructure that S05 (scan flow) and S06 (chain modal) will call. The token-bucket rate limiter is a reusable class parameterized per provider — Finnhub needs 28 tokens refilled every 1000ms, Massive.com needs 5 tokens refilled every 60000ms. Three service clients wrap browser fetch() with correct URL construction, auth patterns, error typing, and AbortSignal passthrough for scan cancellation.

## Steps

1. Create `src/services/rate-limiter.ts` — TokenBucketRateLimiter class. Constructor: (maxTokens, refillCount, refillIntervalMs). acquire(): if tokens > 0, decrement and return immediately; else queue a promise that resolves on next refill tick. Internal setInterval refills tokens up to max and resolves queued promises FIFO. reset(): refill to max. dispose(): clear interval. Must handle concurrent callers correctly — multiple awaiting acquire() calls each consume one token on refill.
2. Create `src/services/api-error.ts` — ApiError class extending Error. Fields: status (number), endpoint (string), responseBody (string|null). Used by all service clients for consistent error typing.
3. Create `src/services/finnhub.ts` — FinnhubService class. Constructor: (apiKey: string, rateLimiter?: TokenBucketRateLimiter). Base URL: `https://finnhub.io/api/v1`. Auth: `token` query param. Methods: getQuote(symbol, signal?), getMetrics(symbol, signal?), getEarningsCalendar(from, to, signal?), getProfile(symbol, signal?), getRecommendations(symbol, signal?). Each method: acquire() from rate limiter if present, build URL with params, fetch with signal, handle 429 with retry (3 attempts, 1200ms backoff), throw ApiError on non-OK responses, parse JSON and return typed result.
4. Create `src/services/alpaca.ts` — AlpacaService class. Constructor: (keyId: string, secretKey: string). Two base URLs: `https://data.alpaca.markets` (data), `https://paper-api.alpaca.markets` (trading). Auth: `APCA-API-KEY-ID` + `APCA-API-SECRET-KEY` headers. Methods: getOptionExpirations(symbol, signal?), getOptionSnapshots(symbol, params?, signal?), getOptionContracts(params?, signal?). Include pagination helper for next_page_token pattern. No rate limiter needed (200 req/min).
5. Create `src/services/massive.ts` — MassiveService class (Polygon API). Constructor: (apiKey: string, rateLimiter?: TokenBucketRateLimiter). Base URL: `https://api.polygon.io`. Auth: `apiKey` query param. Methods: getOptionChainSnapshot(symbol, params?, signal?), getOptionContracts(params?, signal?). Include pagination via next_url. Acquire from rate limiter before each call.
6. Write `src/services/__tests__/rate-limiter.test.ts` — test acquire() immediate when tokens available, acquire() blocks when exhausted and resolves on refill, multiple concurrent acquires resolve in FIFO order one-per-token, reset() refills, dispose() stops refill interval. Use vi.useFakeTimers.
7. Write `src/services/__tests__/services.test.ts` — test URL construction and auth for each service (mock fetch with vi.fn). Verify FinnhubService passes token as query param, AlpacaService sets correct headers and uses correct base URL per method, MassiveService passes apiKey param. Test ApiError construction. Test AbortSignal propagation (pass signal to fetch mock, verify it's forwarded).

## Must-Haves

- [ ] TokenBucketRateLimiter.acquire() blocks when exhausted and resolves on next refill (not rejection)
- [ ] FinnhubService retries on 429 with backoff (3 attempts, 1200ms)
- [ ] AlpacaService uses different base URLs for data vs trading endpoints
- [ ] All service methods accept optional AbortSignal
- [ ] ApiError includes status, endpoint, and responseBody for diagnostics
- [ ] Rate limiter dispose() cleans up interval — no leaked timers

## Verification

- `npx vitest run src/services/__tests__/` — all tests pass
- `npx tsc --noEmit` — zero errors

## Observability Impact

- Signals added/changed: ApiError class with status + endpoint for structured error handling downstream
- How a future agent inspects this: catch ApiError in S05/S06 to get status code and endpoint that failed
- Failure state exposed: ApiError.status (429 = rate limited, 401 = bad key, 403 = forbidden)

## Inputs

- `src/types/index.ts` — StockResult fields inform return types from Finnhub methods
- S02 Research — API endpoint details, auth patterns, rate limit configs
- `IMPLEMENTATION_SPEC.md` — Massive.com/Polygon endpoint specifics

## Expected Output

- `src/services/rate-limiter.ts` — generic TokenBucketRateLimiter class
- `src/services/api-error.ts` — typed ApiError class
- `src/services/finnhub.ts` — FinnhubService with 5 methods + rate limiting + retry
- `src/services/alpaca.ts` — AlpacaService with dual-endpoint + pagination
- `src/services/massive.ts` — MassiveService with rate limiting + pagination
- `src/services/__tests__/rate-limiter.test.ts` — rate limiter behavior tests
- `src/services/__tests__/services.test.ts` — service URL/auth/signal tests
