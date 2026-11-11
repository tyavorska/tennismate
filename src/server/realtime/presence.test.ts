// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { createPresence } from './presence';

describe('presence', () => {
  it('comes online with the first connection only', () => {
    const presence = createPresence();

    expect(presence.connect('a')).toBe(true);
    expect(presence.connect('a')).toBe(false);
    expect(presence.isOnline('a')).toBe(true);
  });

  it('goes offline only when the last tab closes', () => {
    const presence = createPresence();
    presence.connect('a');
    presence.connect('a');

    expect(presence.disconnect('a')).toBe(false);
    expect(presence.isOnline('a')).toBe(true);
    expect(presence.disconnect('a')).toBe(true);
    expect(presence.isOnline('a')).toBe(false);
  });

  it('ignores a disconnect for someone who was never online', () => {
    expect(createPresence().disconnect('ghost')).toBe(false);
  });

  it('lists who is online among the given players', () => {
    const presence = createPresence();
    presence.connect('a');
    presence.connect('c');

    expect(presence.onlineAmong(['a', 'b', 'c'])).toEqual(['a', 'c']);
  });
});
