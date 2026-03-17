/**
 * Typed API error for all service clients.
 * Downstream consumers (S05 scan flow, S06 chain modal) can inspect
 * status (429 = rate limited, 401 = bad key, 403 = forbidden) and
 * endpoint to build user-facing error messages.
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly endpoint: string,
    public readonly responseBody: string | null = null,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}
