import { describe, expect, it } from 'vitest';
import { ApiError } from './errors';
import { retryDelay, shouldRetry } from './retryPolicy';

describe('shouldRetry', () => {
  it('retries a network failure, an unavailable service and a rate limit', () => {
    for (const kind of ['network', 'unavailable', 'rateLimited'] as const) {
      expect(shouldRetry(0, new ApiError({ kind }))).toBe(true);
    }
  });

  it('never retries what will fail again without a change', () => {
    for (const kind of ['validation', 'forbidden', 'notFound', 'conflict', 'server'] as const) {
      expect(shouldRetry(0, new ApiError({ kind }))).toBe(false);
    }
  });

  it('stops after the given number of retries', () => {
    const error = new ApiError({ kind: 'network' });

    expect(shouldRetry(1, error, 2)).toBe(true);
    expect(shouldRetry(2, error, 2)).toBe(false);
  });
});

describe('retryDelay', () => {
  it('backs off 1 s, 2 s, 4 s', () => {
    const error = new ApiError({ kind: 'network' });

    expect([0, 1, 2].map((attempt) => retryDelay(attempt, error))).toEqual([1000, 2000, 4000]);
  });

  it('waits what the server asked for, taken from the problem', () => {
    const error = new ApiError({ kind: 'rateLimited', retryAfterSeconds: 7 });

    expect(retryDelay(0, error)).toBe(7000);
  });
});
