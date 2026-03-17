import { ApiError } from './api-error';
import type { TokenBucketRateLimiter } from './rate-limiter';

const BASE_URL = 'https://finnhub.io/api/v1';
const MAX_RETRIES = 3;
const RETRY_BACKOFF_MS = 1200;

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
 * Rate limit: pair with TokenBucketRateLimiter(28, 28, 1000).
 * Retries 429 responses up to 3 times with 1200ms backoff.
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
    if (this.rateLimiter) {
      await this.rateLimiter.acquire();
    }

    const url = new URL(`${BASE_URL}${path}`);
    url.searchParams.set('token', this.apiKey);
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, value);
    }

    const endpoint = `${path}?${Object.entries(params)
      .map(([k, v]) => `${k}=${v}`)
      .join('&')}`;

    let lastError: ApiError | null = null;
    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      const response = await fetch(url.toString(), { signal });

      if (response.ok) {
        return (await response.json()) as T;
      }

      const body = await response.text().catch(() => null);

      if (response.status === 429 && attempt < MAX_RETRIES - 1) {
        lastError = new ApiError(
          `Finnhub rate limited on ${endpoint}`,
          429,
          endpoint,
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
        `Finnhub ${response.status} on ${endpoint}`,
        response.status,
        endpoint,
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
