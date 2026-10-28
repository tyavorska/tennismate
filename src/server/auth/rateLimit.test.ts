import { describe, expect, it } from 'vitest';
import { checkRateLimit, resetRateLimit } from './rateLimit';

describe('checkRateLimit', () => {
  it('allows five attempts a minute and blocks the sixth', () => {
    const results = Array.from({ length: 6 }, () => checkRateLimit('test:block', 0));
    expect(results.slice(0, 5).every((result) => result.allowed)).toBe(true);
    expect(results[5]).toEqual({ allowed: false, retryAfterSeconds: 60 });
  });

  it('allows attempts again once the minute has passed', () => {
    Array.from({ length: 6 }, () => checkRateLimit('test:window', 0));
    expect(checkRateLimit('test:window', 60_000)).toEqual({ allowed: true });
  });

  it('starts over after a reset', () => {
    Array.from({ length: 6 }, () => checkRateLimit('test:reset', 0));
    resetRateLimit('test:reset');
    expect(checkRateLimit('test:reset', 0)).toEqual({ allowed: true });
  });
});
