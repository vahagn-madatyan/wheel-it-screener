import { ApiError } from './api-error';
import type { TokenBucketRateLimiter } from './rate-limiter';

const BASE_URL = 'https://api.polygon.io';

// ---- Response types matching Polygon API shapes ----

export interface PolygonOptionDetails {
  contract_type: 'call' | 'put';
  exercise_style: 'american' | 'european';
  expiration_date: string;
  shares_per_contract: number;
  strike_price: number;
  ticker: string;
}

export interface PolygonOptionDay {
  change: number;
  change_percent: number;
  close: number;
  high: number;
  last_updated: number;
  low: number;
  open: number;
  previous_close: number;
  volume: number;
  vwap: number;
}

export interface PolygonOptionGreeks {
  delta: number;
  gamma: number;
  theta: number;
  vega: number;
}

export interface PolygonOptionQuote {
  ask: number;
  ask_size: number;
  bid: number;
  bid_size: number;
  last_updated: number;
  midpoint: number;
  timeframe: string;
}

export interface PolygonOptionSnapshotResult {
  break_even_price: number;
  day: PolygonOptionDay;
  details: PolygonOptionDetails;
  greeks: PolygonOptionGreeks;
  implied_volatility: number;
  last_quote: PolygonOptionQuote;
  last_trade?: {
    price: number;
    size: number;
    sip_timestamp: number;
  };
  open_interest: number;
  underlying_asset: {
    change_to_break_even: number;
    last_updated: number;
    price: number;
    ticker: string;
  };
}

export interface PolygonOptionChainResponse {
  results: PolygonOptionSnapshotResult[];
  status: string;
  request_id: string;
  next_url?: string;
}

export interface PolygonOptionContractRef {
  cfi: string;
  contract_type: 'call' | 'put';
  exercise_style: 'american' | 'european';
  expiration_date: string;
  primary_exchange: string;
  shares_per_contract: number;
  strike_price: number;
  ticker: string;
  underlying_ticker: string;
}

export interface PolygonContractsResponse {
  results: PolygonOptionContractRef[];
  status: string;
  request_id: string;
  next_url?: string;
}

/**
 * Massive.com (Polygon) API service client.
 *
 * Auth: `apiKey` query param.
 * Rate limit: pair with TokenBucketRateLimiter(5, 5, 60000) for free tier.
 * Pagination: follows `next_url` from response.
 */
export class MassiveService {
  constructor(
    private readonly apiKey: string,
    private readonly rateLimiter?: TokenBucketRateLimiter,
  ) {}

  /**
   * Fetch option chain snapshot for an underlying asset.
   * Returns first page — use getAllOptionChainSnapshots for full pagination.
   */
  async getOptionChainSnapshot(
    symbol: string,
    params?: Record<string, string>,
    signal?: AbortSignal,
  ): Promise<PolygonOptionChainResponse> {
    return this.request<PolygonOptionChainResponse>(
      `/v3/snapshot/options/${symbol}`,
      params ?? {},
      signal,
    );
  }

  /**
   * Fetch all option chain snapshots, following next_url pagination.
   */
  async getAllOptionChainSnapshots(
    symbol: string,
    params?: Record<string, string>,
    signal?: AbortSignal,
  ): Promise<PolygonOptionSnapshotResult[]> {
    const all: PolygonOptionSnapshotResult[] = [];

    const firstPage = await this.getOptionChainSnapshot(symbol, params, signal);
    all.push(...firstPage.results);

    let nextUrl = firstPage.next_url;
    while (nextUrl) {
      const page = await this.requestUrl<PolygonOptionChainResponse>(
        nextUrl,
        signal,
      );
      all.push(...page.results);
      nextUrl = page.next_url;
    }

    return all;
  }

  /**
   * Fetch option contracts reference data.
   */
  async getOptionContracts(
    params?: Record<string, string>,
    signal?: AbortSignal,
  ): Promise<PolygonContractsResponse> {
    return this.request<PolygonContractsResponse>(
      '/v3/reference/options/contracts',
      params ?? {},
      signal,
    );
  }

  /**
   * Fetch all option contracts, following next_url pagination.
   */
  async getAllOptionContracts(
    params?: Record<string, string>,
    signal?: AbortSignal,
  ): Promise<PolygonOptionContractRef[]> {
    const all: PolygonOptionContractRef[] = [];

    const firstPage = await this.getOptionContracts(params, signal);
    all.push(...firstPage.results);

    let nextUrl = firstPage.next_url;
    while (nextUrl) {
      const page = await this.requestUrl<PolygonContractsResponse>(
        nextUrl,
        signal,
      );
      all.push(...page.results);
      nextUrl = page.next_url;
    }

    return all;
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
    url.searchParams.set('apiKey', this.apiKey);
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, value);
    }

    const response = await fetch(url.toString(), { signal });

    if (!response.ok) {
      const body = await response.text().catch(() => null);
      throw new ApiError(
        `Polygon ${response.status} on ${path}`,
        response.status,
        path,
        body,
      );
    }

    return (await response.json()) as T;
  }

  /**
   * Fetch a full URL (used for next_url pagination).
   * Appends apiKey if not already present.
   */
  private async requestUrl<T>(
    fullUrl: string,
    signal?: AbortSignal,
  ): Promise<T> {
    if (this.rateLimiter) {
      await this.rateLimiter.acquire();
    }

    const url = new URL(fullUrl);
    if (!url.searchParams.has('apiKey')) {
      url.searchParams.set('apiKey', this.apiKey);
    }

    const response = await fetch(url.toString(), { signal });

    if (!response.ok) {
      const body = await response.text().catch(() => null);
      throw new ApiError(
        `Polygon ${response.status} on ${url.pathname}`,
        response.status,
        url.pathname,
        body,
      );
    }

    return (await response.json()) as T;
  }
}
