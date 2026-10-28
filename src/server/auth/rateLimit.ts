import 'server-only';

const windowMs = 60_000;
const maxAttempts = 5;

type Window = Readonly<{ count: number; startedAt: number }>;

// Per process and lost on restart: fine for a single server, not for several.
const attempts = new Map<string, Window>();

export type RateLimitResult = { allowed: true } | { allowed: false; retryAfterSeconds: number };

export function checkRateLimit(key: string, now: number = Date.now()): RateLimitResult {
  const current = attempts.get(key);
  const window =
    current === undefined || now - current.startedAt >= windowMs
      ? { count: 1, startedAt: now }
      : { count: current.count + 1, startedAt: current.startedAt };
  attempts.set(key, window);

  if (window.count <= maxAttempts) return { allowed: true };
  return {
    allowed: false,
    retryAfterSeconds: Math.ceil((window.startedAt + windowMs - now) / 1000),
  };
}

export function resetRateLimit(key: string): void {
  attempts.delete(key);
}
