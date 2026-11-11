import 'server-only';

const windowMs = 10_000;
const maxMessages = 20;

/** Allows a short burst of messages per player, so one open socket cannot flood the database. */
export function createSendLimit() {
  const windows = new Map<string, { count: number; startedAt: number }>();

  return {
    /** Returns the seconds to wait when the player is over the limit. */
    check(
      userId: string,
      now: number = Date.now(),
    ): { allowed: true } | { allowed: false; retryAfterSeconds: number } {
      const current = windows.get(userId);
      const window =
        current === undefined || now - current.startedAt >= windowMs
          ? { count: 1, startedAt: now }
          : { count: current.count + 1, startedAt: current.startedAt };
      windows.set(userId, window);
      if (window.count <= maxMessages) return { allowed: true };
      return {
        allowed: false,
        retryAfterSeconds: Math.ceil((window.startedAt + windowMs - now) / 1000),
      };
    },
  };
}
