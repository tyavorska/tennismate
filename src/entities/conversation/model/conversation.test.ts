import { describe, expect, it } from 'vitest';
import { newInviteSchema } from './conversation';

const invite = { court: 'Kazimierz Clay Club', date: '2026-11-25', time: '18:00' };

describe('newInviteSchema', () => {
  it('accepts a real day and time', () => {
    expect(newInviteSchema.safeParse(invite).success).toBe(true);
  });

  it.each([{ date: '2026-02-31' }, { date: '2026-13-01' }, { time: '99:99' }, { time: '24:00' }])(
    'rejects %o, which would roll over to another day',
    (wrong) => {
      expect(newInviteSchema.safeParse({ ...invite, ...wrong }).success).toBe(false);
    },
  );
});
