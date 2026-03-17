/**
 * Token-bucket rate limiter for browser API clients.
 *
 * Usage:
 *   const limiter = new TokenBucketRateLimiter(2, 2, 2100); // Finnhub free tier
 *   await limiter.acquire(); // blocks when exhausted, resolves on next refill
 *
 * Configs:
 *   Finnhub:  (2, 2, 2100)    — ~57 req/min (free tier limit: 60 req/min)
 *   Massive:  (5, 5, 60000)    — 5 req/min (free tier)
 */
export class TokenBucketRateLimiter {
  private tokens: number;
  private queue: Array<() => void> = [];
  private intervalId: ReturnType<typeof setInterval> | null = null;

  constructor(
    private readonly maxTokens: number,
    private readonly refillCount: number,
    private readonly refillIntervalMs: number,
  ) {
    this.tokens = maxTokens;
    this.startRefill();
  }

  /**
   * Acquire one token. Returns immediately if available,
   * otherwise queues a promise that resolves on the next refill.
   */
  async acquire(): Promise<void> {
    if (this.tokens > 0) {
      this.tokens--;
      return;
    }
    return new Promise<void>((resolve) => {
      this.queue.push(resolve);
    });
  }

  /** Refill tokens to max and drain queued waiters. */
  reset(): void {
    this.tokens = this.maxTokens;
    this.drainQueue();
  }

  /** Stop the refill interval. Call this to prevent leaked timers. */
  dispose(): void {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  private startRefill(): void {
    this.intervalId = setInterval(() => {
      this.tokens = Math.min(this.tokens + this.refillCount, this.maxTokens);
      this.drainQueue();
    }, this.refillIntervalMs);
  }

  /** Resolve queued waiters one-per-available-token, FIFO order. */
  private drainQueue(): void {
    while (this.queue.length > 0 && this.tokens > 0) {
      this.tokens--;
      const resolve = this.queue.shift()!;
      resolve();
    }
  }
}
