// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { createSendLimit } from './sendLimit';

describe('send limit', () => {
  it('allows a burst, then asks the player to wait', () => {
    const limit = createSendLimit();
    for (let sent = 0; sent < 20; sent++) expect(limit.check('a', 0).allowed).toBe(true);

    expect(limit.check('a', 1000)).toEqual({ allowed: false, retryAfterSeconds: 9 });
  });

  it('allows messages again in the next window, and counts players apart', () => {
    const limit = createSendLimit();
    for (let sent = 0; sent < 21; sent++) limit.check('a', 0);

    expect(limit.check('a', 10_000).allowed).toBe(true);
    expect(limit.check('b', 0).allowed).toBe(true);
  });
});
