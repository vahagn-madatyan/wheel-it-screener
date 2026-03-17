import { ApiError } from './api-error';
import type { TokenBucketRateLimiter } from './rate-limiter';

const BASE_URL = 'https://finnhub.io/api/v1';
const MAX_RETRIES = 4;
const RETRY_BACKOFF_MS = 3000;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

/** Module-level cache shared across FinnhubService instances within a session */
const responseCache = new Map<string, { data: unknown; expiry: number }>();

/** Clear the response cache (useful for tests and manual cache invalidation) */
export function clearFinnhubCache(): void {
  responseCache.clear();
}

// ---- Response types matching Finnhub API shapes ----

export interface FinnhubQuote {
  c: number; // current price
  d: number; // change
  dp: number; // percent change
  h: number; // high
  l: number; // low
  o: number; // open
  pc: number; // previous close
  t: number; // timestamp
}

export interface FinnhubMetrics {
  metric: Record<string, number | null>;
  metricType: string;
  symbol: string;
}

export interface FinnhubEarningsEvent {
  date: string;
  epsActual: number | null;
  epsEstimate: number | null;
  hour: string;
  quarter: number;
  revenueActual: number | null;
  revenueEstimate: number | null;
  symbol: string;
  year: number;
}

export interface FinnhubEarningsCalendar {
  earningsCalendar: FinnhubEarningsEvent[];
}

export interface FinnhubProfile {
  country: string;
  currency: string;
  exchange: string;
  finnhubIndustry: string;
  ipo: string;
  logo: string;
  marketCapitalization: number;
  name: string;
  phone: string;
  shareOutstanding: number;
  ticker: string;
  weburl: string;
}

export interface FinnhubRecommendation {
  buy: number;
  hold: number;
  period: string;
  sell: number;
  strongBuy: number;
  strongSell: number;
  symbol: string;
}

/**
 * Finnhub API service client.
 *
 * Auth: `token` query param.
 * Free tier: 60 API calls/min. Pair with TokenBucketRateLimiter(2, 2, 2100).
 * Retries 429 responses up to 4 times with 3s exponential backoff.
 * Includes in-memory response cache (5 min TTL) to avoid redundant calls.
 */
export class FinnhubService {
  constructor(
    private readonly apiKey: string,
    private readonly rateLimiter?: TokenBucketRateLimiter,
  ) {}

  async getQuote(symbol: string, signal?: AbortSignal): Promise<FinnhubQuote> {
    return this.request<FinnhubQuote>('/quote', { symbol }, signal);
  }

  async getMetrics(
    symbol: string,
    signal?: AbortSignal,
  ): Promise<FinnhubMetrics> {
    return this.request<FinnhubMetrics>(
      '/stock/metric',
      { symbol, metric: 'all' },
      signal,
    );
  }

  async getEarningsCalendar(
    from: string,
    to: string,
    signal?: AbortSignal,
  ): Promise<FinnhubEarningsCalendar> {
    return this.request<FinnhubEarningsCalendar>(
      '/calendar/earnings',
      { from, to },
      signal,
    );
  }

  async getProfile(
    symbol: string,
    signal?: AbortSignal,
  ): Promise<FinnhubProfile> {
    return this.request<FinnhubProfile>('/stock/profile2', { symbol }, signal);
  }

  async getRecommendations(
    symbol: string,
    signal?: AbortSignal,
  ): Promise<FinnhubRecommendation[]> {
    return this.request<FinnhubRecommendation[]>(
      '/stock/recommendation',
      { symbol },
      signal,
    );
  }

  private async request<T>(
    path: string,
    params: Record<string, string>,
    signal?: AbortSignal,
  ): Promise<T> {
    const cacheKey = `${path}?${Object.entries(params)
      .map(([k, v]) => `${k}=${v}`)
      .join('&')}`;

    // Check cache before consuming a rate limit token
    const cached = responseCache.get(cacheKey);
    if (cached && cached.expiry > Date.now()) {
      return cached.data as T;
    }

    if (this.rateLimiter) {
      await this.rateLimiter.acquire();
    }

    const url = new URL(`${BASE_URL}${path}`);
    url.searchParams.set('token', this.apiKey);
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, value);
    }

    let lastError: ApiError | null = null;
    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      const response = await fetch(url.toString(), { signal });

      if (response.ok) {
        const data = (await response.json()) as T;
        responseCache.set(cacheKey, {
          data,
          expiry: Date.now() + CACHE_TTL_MS,
        });
        return data;
      }

      const body = await response.text().catch(() => null);

      if (response.status === 429 && attempt < MAX_RETRIES - 1) {
        lastError = new ApiError(
          `Finnhub rate limited on ${cacheKey}`,
          429,
          cacheKey,
          body,
        );
        await delay(RETRY_BACKOFF_MS * (attempt + 1));
        // Re-acquire after backoff
        if (this.rateLimiter) {
          await this.rateLimiter.acquire();
        }
        continue;
      }

      throw new ApiError(
        `Finnhub ${response.status} on ${cacheKey}`,
        response.status,
        cacheKey,
        body,
      );
    }

    // All retries exhausted (only reachable if all attempts were 429)
    throw lastError!;
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
