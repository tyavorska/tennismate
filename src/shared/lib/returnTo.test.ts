import { describe, expect, it } from 'vitest';
import { safeReturnTo } from './returnTo';

describe('safeReturnTo', () => {
  it('keeps a same-site path', () => {
    expect(safeReturnTo('/account?tab=profile')).toBe('/account?tab=profile');
  });

  it('falls back to home when there is no value', () => {
    expect(safeReturnTo(null)).toBe('/home');
    expect(safeReturnTo(undefined)).toBe('/home');
  });

  it.each(['https://evil.example', '//evil.example', '/\\evil.example', 'home'])(
    'rejects %s, which could leave the site',
    (value) => {
      expect(safeReturnTo(value)).toBe('/home');
    },
  );
});
