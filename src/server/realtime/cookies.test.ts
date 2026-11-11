// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { readCookie } from './cookies';

describe('readCookie', () => {
  it('finds a cookie among several', () => {
    expect(readCookie('theme=dark; session=abc_123; other=1', 'session')).toBe('abc_123');
  });

  it('does not match a cookie whose name only ends with the one asked for', () => {
    expect(readCookie('old_session=x', 'session')).toBeUndefined();
  });

  it('answers nothing without a header or without the cookie', () => {
    expect(readCookie(undefined, 'session')).toBeUndefined();
    expect(readCookie('theme=dark', 'session')).toBeUndefined();
  });
});
