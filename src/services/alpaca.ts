import { ApiError } from './api-error';

const DATA_BASE_URL = 'https://data.alpaca.markets';
const TRADING_BASE_URL = 'https://paper-api.alpaca.markets';

// ---- Response types matching Alpaca API shapes ----

export interface AlpacaOptionSnapshot {
  greeks?: {
    delta: number;
    gamma: number;
    theta: number;
    vega: number;
    rho: number;
  };
  impliedVolatility?: number;
  latestQuote?: {
    ap: number; // ask price
    as: number; // ask size
    bp: number; // bid price
    bs: number; // bid size
    t: string; // timestamp
  };
  latestTrade?: {
    p: number; // price
    s: number; // size
    t: string; // timestamp
  };
}

export interface AlpacaOptionSnapshotsResponse {
  snapshots: Record<string, AlpacaOptionSnapshot>;
  next_page_token: string | null;
}

export interface AlpacaOptionContract {
  id: string;
  symbol: string;
  name: string;
  status: string;
  tradable: boolean;
  expiration_date: string;
  root_symbol: string;
  underlying_symbol: string;
  underlying_asset_id: string;
  type: 'call' | 'put';
  style: 'american' | 'european';
  strike_price: string;
  size: string;
  open_interest: string;
  open_interest_date: string;
  close_price: string;
  close_price_date: string;
}

export interface AlpacaOptionContractsResponse {
  option_contracts: AlpacaOptionContract[];
  next_page_token: string | null;
}

/**
 * Alpaca Markets API service client.
 *
 * Uses two base URLs:
 *   - data.alpaca.markets for market data (snapshots)
 *   - paper-api.alpaca.markets for trading/reference (expirations, contracts)
 *
 * Auth: APCA-API-KEY-ID + APCA-API-SECRET-KEY headers.
 * No rate limiter needed (200 req/min).
 */
export class AlpacaService {
  constructor(
    private readonly keyId: string,
    private readonly secretKey: string,
  ) {}

  async getOptionExpirations(
    symbol: string,
    signal?: AbortSignal,
  ): Promise<string[]> {
    // No dedicated expirations endpoint — extract unique dates from contracts listing
    const contracts = await this.getAllOptionContracts(
      { underlying_symbols: symbol },
      signal,
    );
    return [...new Set(contracts.map((c) => c.expiration_date))].sort();
  }

  async getOptionSnapshots(
    symbol: string,
    params?: Record<string, string>,
    signal?: AbortSignal,
  ): Promise<AlpacaOptionSnapshotsResponse> {
    return this.request<AlpacaOptionSnapshotsResponse>(
      'data',
      `/v1beta1/options/snapshots/${symbol}`,
      params ?? {},
      signal,
    );
  }

  async getOptionContracts(
    params?: Record<string, string>,
    signal?: AbortSignal,
  ): Promise<AlpacaOptionContractsResponse> {
    return this.request<AlpacaOptionContractsResponse>(
      'trading',
      `/v2/options/contracts`,
      params ?? {},
      signal,
    );
  }

  /**
   * Paginate through all option contracts matching params.
   * Follows next_page_token until exhausted.
   */
  async getAllOptionContracts(
    params?: Record<string, string>,
    signal?: AbortSignal,
  ): Promise<AlpacaOptionContract[]> {
    const all: AlpacaOptionContract[] = [];
    let pageToken: string | null = null;

    do {
      const queryParams = { ...params };
      if (pageToken) {
        queryParams['page_token'] = pageToken;
      }

      const response = await this.getOptionContracts(queryParams, signal);
      all.push(...response.option_contracts);
      pageToken = response.next_page_token;
    } while (pageToken);

    return all;
  }

  private async request<T>(
    endpoint: 'data' | 'trading',
    path: string,
    params: Record<string, string>,
    signal?: AbortSignal,
  ): Promise<T> {
    const baseUrl = endpoint === 'data' ? DATA_BASE_URL : TRADING_BASE_URL;
    const url = new URL(`${baseUrl}${path}`);

    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, value);
    }

    const response = await fetch(url.toString(), {
      signal,
      headers: {
        'APCA-API-KEY-ID': this.keyId,
        'APCA-API-SECRET-KEY': this.secretKey,
      },
    });

    if (!response.ok) {
      const body = await response.text().catch(() => null);
      throw new ApiError(
        `Alpaca ${response.status} on ${path}`,
        response.status,
        path,
        body,
      );
    }

    return (await response.json()) as T;
  }
}
