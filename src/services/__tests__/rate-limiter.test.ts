import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { TokenBucketRateLimiter } from '../rate-limiter';

describe('TokenBucketRateLimiter', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('acquire() resolves immediately when tokens available', async () => {
    const limiter = new TokenBucketRateLimiter(3, 3, 1000);

    const resolved = vi.fn();
    limiter.acquire().then(resolved);
    await vi.advanceTimersByTimeAsync(0);

    expect(resolved).toHaveBeenCalled();
    limiter.dispose();
  });

  it('acquire() blocks when tokens exhausted and resolves on refill', async () => {
    const limiter = new TokenBucketRateLimiter(2, 2, 1000);

    // Drain both tokens
    await limiter.acquire();
    await limiter.acquire();

    // Third acquire should block
    const resolved = vi.fn();
    limiter.acquire().then(resolved);
    await vi.advanceTimersByTimeAsync(0);
    expect(resolved).not.toHaveBeenCalled();

    // Advance to refill
    await vi.advanceTimersByTimeAsync(1000);
    expect(resolved).toHaveBeenCalled();

    limiter.dispose();
  });

  it('multiple concurrent acquires resolve in FIFO order, one per token', async () => {
    // maxTokens=3, refillCount=2 — so refill adds 2 tokens per interval (capped at 3)
    const limiter = new TokenBucketRateLimiter(3, 2, 1000);

    // Drain all 3 tokens
    await limiter.acquire();
    await limiter.acquire();
    await limiter.acquire();

    // Queue 3 waiters
    const order: number[] = [];
    limiter.acquire().then(() => order.push(1));
    limiter.acquire().then(() => order.push(2));
    limiter.acquire().then(() => order.push(3));

    await vi.advanceTimersByTimeAsync(0);
    expect(order).toEqual([]);

    // Refill gives 2 tokens — first 2 waiters should resolve (FIFO)
    await vi.advanceTimersByTimeAsync(1000);
    expect(order).toEqual([1, 2]);

    // Next refill resolves the 3rd
    await vi.advanceTimersByTimeAsync(1000);
    expect(order).toEqual([1, 2, 3]);

    limiter.dispose();
  });

  it('reset() refills to max and drains queued waiters', async () => {
    const limiter = new TokenBucketRateLimiter(2, 2, 1000);

    // Drain
    await limiter.acquire();
    await limiter.acquire();

    // Queue a waiter
    const resolved = vi.fn();
    limiter.acquire().then(resolved);
    await vi.advanceTimersByTimeAsync(0);
    expect(resolved).not.toHaveBeenCalled();

    // Reset should resolve the waiter immediately
    limiter.reset();
    await vi.advanceTimersByTimeAsync(0);
    expect(resolved).toHaveBeenCalled();

    limiter.dispose();
  });

  it('dispose() stops refill interval — no leaked timers', async () => {
    const limiter = new TokenBucketRateLimiter(1, 1, 1000);

    // Drain
    await limiter.acquire();

    // Queue a waiter
    const resolved = vi.fn();
    limiter.acquire().then(resolved);

    // Dispose before refill
    limiter.dispose();
    await vi.advanceTimersByTimeAsync(5000);

    // Waiter never resolved because interval was cleared
    expect(resolved).not.toHaveBeenCalled();
  });

  it('tokens do not exceed maxTokens on refill', async () => {
    const limiter = new TokenBucketRateLimiter(3, 3, 1000);

    // Don't consume any tokens, let a few refills happen
    await vi.advanceTimersByTimeAsync(3000);

    // Should still only have 3 tokens available (the max)
    await limiter.acquire();
    await limiter.acquire();
    await limiter.acquire();

    // 4th should block
    const resolved = vi.fn();
    limiter.acquire().then(resolved);
    await vi.advanceTimersByTimeAsync(0);
    expect(resolved).not.toHaveBeenCalled();

    limiter.dispose();
  });
});
