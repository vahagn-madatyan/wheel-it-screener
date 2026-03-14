import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ApiError } from '../api-error';
import { FinnhubService } from '../finnhub';
import { AlpacaService } from '../alpaca';
import { MassiveService } from '../massive';

// Mock global fetch
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

function jsonResponse(data: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(data),
    text: () => Promise.resolve(JSON.stringify(data)),
  } as Response;
}

function errorResponse(status: number, body = 'error'): Response {
  return {
    ok: false,
    status,
    json: () => Promise.resolve({}),
    text: () => Promise.resolve(body),
  } as Response;
}

beforeEach(() => {
  mockFetch.mockReset();
});

// ---- ApiError ----

describe('ApiError', () => {
  it('has correct fields', () => {
    const err = new ApiError('msg', 429, '/quote?symbol=AAPL', '{"error":"rate limit"}');
    expect(err.message).toBe('msg');
    expect(err.status).toBe(429);
    expect(err.endpoint).toBe('/quote?symbol=AAPL');
    expect(err.responseBody).toBe('{"error":"rate limit"}');
    expect(err.name).toBe('ApiError');
    expect(err).toBeInstanceOf(Error);
  });

  it('responseBody defaults to null', () => {
    const err = new ApiError('msg', 500, '/test');
    expect(err.responseBody).toBeNull();
  });
});

// ---- FinnhubService ----

describe('FinnhubService', () => {
  it('passes token as query param and builds correct URL', async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({ c: 150 }));
    const svc = new FinnhubService('test-key-123');

    await svc.getQuote('AAPL');

    const url = new URL(mockFetch.mock.calls[0][0] as string);
    expect(url.origin + url.pathname).toBe('https://finnhub.io/api/v1/quote');
    expect(url.searchParams.get('token')).toBe('test-key-123');
    expect(url.searchParams.get('symbol')).toBe('AAPL');
  });

  it('builds correct URL for getMetrics', async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({ metric: {} }));
    const svc = new FinnhubService('key');

    await svc.getMetrics('MSFT');

    const url = new URL(mockFetch.mock.calls[0][0] as string);
    expect(url.pathname).toBe('/api/v1/stock/metric');
    expect(url.searchParams.get('symbol')).toBe('MSFT');
    expect(url.searchParams.get('metric')).toBe('all');
  });

  it('builds correct URL for getEarningsCalendar', async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({ earningsCalendar: [] }));
    const svc = new FinnhubService('key');

    await svc.getEarningsCalendar('2026-01-01', '2026-03-01');

    const url = new URL(mockFetch.mock.calls[0][0] as string);
    expect(url.pathname).toBe('/api/v1/calendar/earnings');
    expect(url.searchParams.get('from')).toBe('2026-01-01');
    expect(url.searchParams.get('to')).toBe('2026-03-01');
  });

  it('builds correct URL for getProfile', async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({ name: 'Apple' }));
    const svc = new FinnhubService('key');

    await svc.getProfile('AAPL');

    const url = new URL(mockFetch.mock.calls[0][0] as string);
    expect(url.pathname).toBe('/api/v1/stock/profile2');
  });

  it('builds correct URL for getRecommendations', async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse([]));
    const svc = new FinnhubService('key');

    await svc.getRecommendations('AAPL');

    const url = new URL(mockFetch.mock.calls[0][0] as string);
    expect(url.pathname).toBe('/api/v1/stock/recommendation');
  });

  it('throws ApiError on non-OK response with correct status', async () => {
    mockFetch.mockResolvedValueOnce(errorResponse(401, 'unauthorized'));
    const svc = new FinnhubService('bad-key');

    try {
      await svc.getQuote('AAPL');
      expect.unreachable('should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(ApiError);
      expect((err as ApiError).status).toBe(401);
      expect((err as ApiError).responseBody).toBe('unauthorized');
    }
  });

  it('retries on 429 with backoff (3 attempts)', async () => {
    vi.useFakeTimers();

    mockFetch
      .mockResolvedValueOnce(errorResponse(429))
      .mockResolvedValueOnce(errorResponse(429))
      .mockResolvedValueOnce(jsonResponse({ c: 100 }));

    const svc = new FinnhubService('key');
    const promise = svc.getQuote('AAPL');

    // First retry after 1200ms
    await vi.advanceTimersByTimeAsync(1200);
    // Second retry after 2400ms
    await vi.advanceTimersByTimeAsync(2400);

    const result = await promise;
    expect(result).toEqual({ c: 100 });
    expect(mockFetch).toHaveBeenCalledTimes(3);

    vi.useRealTimers();
  });

  it('throws ApiError after all 429 retries exhausted', async () => {
    vi.useFakeTimers();

    mockFetch
      .mockResolvedValueOnce(errorResponse(429))
      .mockResolvedValueOnce(errorResponse(429))
      .mockResolvedValueOnce(errorResponse(429));

    const svc = new FinnhubService('key');
    const promise = svc.getQuote('AAPL');

    // Attach catch handler eagerly so Node doesn't report unhandled rejection
    // while timers are advancing
    const resultPromise = promise.catch((err: unknown) => err as ApiError);

    // Advance past all backoff delays
    await vi.advanceTimersByTimeAsync(1200);
    await vi.advanceTimersByTimeAsync(2400);

    const err = await resultPromise;
    expect(err).toBeInstanceOf(ApiError);
    expect(err.status).toBe(429);
    expect(mockFetch).toHaveBeenCalledTimes(3);

    vi.useRealTimers();
  });

  it('forwards AbortSignal to fetch', async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({ c: 100 }));
    const controller = new AbortController();
    const svc = new FinnhubService('key');

    await svc.getQuote('AAPL', controller.signal);

    const fetchOptions = mockFetch.mock.calls[0][1] as RequestInit;
    expect(fetchOptions.signal).toBe(controller.signal);
  });
});

// ---- AlpacaService ----

describe('AlpacaService', () => {
  it('uses data base URL for snapshots and sets correct auth headers', async () => {
    mockFetch.mockResolvedValueOnce(
      jsonResponse({ snapshots: {}, next_page_token: null }),
    );
    const svc = new AlpacaService('my-key-id', 'my-secret');

    await svc.getOptionSnapshots('AAPL');

    const url = new URL(mockFetch.mock.calls[0][0] as string);
    expect(url.origin).toBe('https://data.alpaca.markets');
    expect(url.pathname).toBe('/v1beta1/options/snapshots/AAPL');

    const headers = mockFetch.mock.calls[0][1].headers as Record<string, string>;
    expect(headers['APCA-API-KEY-ID']).toBe('my-key-id');
    expect(headers['APCA-API-SECRET-KEY']).toBe('my-secret');
  });

  it('uses trading base URL for contracts', async () => {
    mockFetch.mockResolvedValueOnce(
      jsonResponse({ option_contracts: [], next_page_token: null }),
    );
    const svc = new AlpacaService('id', 'secret');

    await svc.getOptionContracts({ underlying_symbols: 'AAPL' });

    const url = new URL(mockFetch.mock.calls[0][0] as string);
    expect(url.origin).toBe('https://paper-api.alpaca.markets');
    expect(url.pathname).toBe('/v2/options/contracts');
  });

  it('paginates through all option contracts', async () => {
    mockFetch
      .mockResolvedValueOnce(
        jsonResponse({
          option_contracts: [{ id: '1', expiration_date: '2026-04-17' }],
          next_page_token: 'page2',
        }),
      )
      .mockResolvedValueOnce(
        jsonResponse({
          option_contracts: [{ id: '2', expiration_date: '2026-05-15' }],
          next_page_token: null,
        }),
      );

    const svc = new AlpacaService('id', 'secret');
    const contracts = await svc.getAllOptionContracts({ underlying_symbols: 'AAPL' });

    expect(contracts).toHaveLength(2);
    expect(contracts[0].id).toBe('1');
    expect(contracts[1].id).toBe('2');

    // Second call should include page_token
    const secondUrl = new URL(mockFetch.mock.calls[1][0] as string);
    expect(secondUrl.searchParams.get('page_token')).toBe('page2');
  });

  it('throws ApiError on non-OK response', async () => {
    mockFetch.mockResolvedValueOnce(errorResponse(403, 'forbidden'));
    const svc = new AlpacaService('id', 'secret');

    await expect(
      svc.getOptionContracts({ underlying_symbols: 'AAPL' }),
    ).rejects.toThrow(ApiError);
  });

  it('forwards AbortSignal to fetch', async () => {
    mockFetch.mockResolvedValueOnce(
      jsonResponse({ snapshots: {}, next_page_token: null }),
    );
    const controller = new AbortController();
    const svc = new AlpacaService('id', 'secret');

    await svc.getOptionSnapshots('AAPL', undefined, controller.signal);

    const fetchOptions = mockFetch.mock.calls[0][1] as RequestInit;
    expect(fetchOptions.signal).toBe(controller.signal);
  });
});

// ---- MassiveService ----

describe('MassiveService', () => {
  it('passes apiKey as query param and builds correct URL', async () => {
    mockFetch.mockResolvedValueOnce(
      jsonResponse({ results: [], status: 'OK', request_id: '1' }),
    );
    const svc = new MassiveService('poly-key-123');

    await svc.getOptionChainSnapshot('AAPL');

    const url = new URL(mockFetch.mock.calls[0][0] as string);
    expect(url.origin).toBe('https://api.polygon.io');
    expect(url.pathname).toBe('/v3/snapshot/options/AAPL');
    expect(url.searchParams.get('apiKey')).toBe('poly-key-123');
  });

  it('builds correct URL for getOptionContracts', async () => {
    mockFetch.mockResolvedValueOnce(
      jsonResponse({ results: [], status: 'OK', request_id: '1' }),
    );
    const svc = new MassiveService('key');

    await svc.getOptionContracts({ underlying_ticker: 'AAPL' });

    const url = new URL(mockFetch.mock.calls[0][0] as string);
    expect(url.pathname).toBe('/v3/reference/options/contracts');
    expect(url.searchParams.get('underlying_ticker')).toBe('AAPL');
  });

  it('follows next_url pagination', async () => {
    mockFetch
      .mockResolvedValueOnce(
        jsonResponse({
          results: [{ ticker: 'O:AAPL260417P00100000' }],
          status: 'OK',
          request_id: '1',
          next_url: 'https://api.polygon.io/v3/snapshot/options/AAPL?cursor=page2',
        }),
      )
      .mockResolvedValueOnce(
        jsonResponse({
          results: [{ ticker: 'O:AAPL260417P00105000' }],
          status: 'OK',
          request_id: '2',
        }),
      );

    const svc = new MassiveService('key');
    const results = await svc.getAllOptionChainSnapshots('AAPL');

    expect(results).toHaveLength(2);
    // next_url call should include apiKey
    const secondUrl = new URL(mockFetch.mock.calls[1][0] as string);
    expect(secondUrl.searchParams.get('apiKey')).toBe('key');
  });

  it('throws ApiError on non-OK response', async () => {
    mockFetch.mockResolvedValueOnce(errorResponse(401, 'bad key'));
    const svc = new MassiveService('bad');

    await expect(svc.getOptionChainSnapshot('AAPL')).rejects.toThrow(ApiError);
  });

  it('forwards AbortSignal to fetch', async () => {
    mockFetch.mockResolvedValueOnce(
      jsonResponse({ results: [], status: 'OK', request_id: '1' }),
    );
    const controller = new AbortController();
    const svc = new MassiveService('key');

    await svc.getOptionChainSnapshot('AAPL', undefined, controller.signal);

    const fetchOptions = mockFetch.mock.calls[0][1] as RequestInit;
    expect(fetchOptions.signal).toBe(controller.signal);
  });
});
