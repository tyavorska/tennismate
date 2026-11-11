import { describe, expect, it } from 'vitest';
import { formatListTime, formatMessageTime } from './format';

const warsaw = 'Europe/Warsaw';
const now = new Date('2026-11-11T12:00:00.000Z');

describe('formatMessageTime', () => {
  it('shows the time in the time zone of the city', () => {
    expect(formatMessageTime('2026-11-11T17:42:00.000Z', warsaw)).toBe('18:42');
    expect(formatMessageTime('2026-11-11T17:42:00.000Z', 'Europe/London')).toBe('17:42');
  });
});

describe('formatListTime', () => {
  it('shows the time for a message from today', () => {
    expect(formatListTime('2026-11-11T08:05:00.000Z', warsaw, now)).toBe('09:05');
  });

  it('says Yesterday, then the weekday, then the date', () => {
    expect(formatListTime('2026-11-10T20:00:00.000Z', warsaw, now)).toBe('Yesterday');
    expect(formatListTime('2026-11-08T10:00:00.000Z', warsaw, now)).toBe('Sun');
    expect(formatListTime('2026-10-30T10:00:00.000Z', warsaw, now)).toBe('30 Oct');
  });

  it('counts the day in the city, not in UTC', () => {
    expect(
      formatListTime('2026-11-10T23:30:00.000Z', warsaw, new Date('2026-11-11T08:00:00.000Z')),
    ).toBe('00:30');
  });
});
