import { describe, expect, it } from 'vitest';
import { addDays, isoDateSchema } from './isoDate';
import { krakowToUtc, nextWeekday, toKrakowWallClock, todayInKrakow } from './krakowTime';

const date = (iso: string) => isoDateSchema.parse(iso);

describe('krakowToUtc', () => {
  it('uses UTC+1 in winter', () => {
    expect(krakowToUtc(date('2026-11-02'), '19:00').toISOString()).toBe('2026-11-02T18:00:00.000Z');
  });

  it('uses UTC+2 in summer', () => {
    expect(krakowToUtc(date('2026-07-15'), '19:00').toISOString()).toBe('2026-07-15T17:00:00.000Z');
  });

  it('follows the clocks on the day they change', () => {
    expect(krakowToUtc(date('2026-03-29'), '10:00').toISOString()).toBe('2026-03-29T08:00:00.000Z');
    expect(krakowToUtc(date('2026-10-25'), '10:00').toISOString()).toBe('2026-10-25T09:00:00.000Z');
  });
});

describe('toKrakowWallClock', () => {
  it('turns a UTC instant back into the Kraków date and time', () => {
    expect(toKrakowWallClock(new Date('2026-11-02T18:00:00.000Z'))).toEqual({
      date: '2026-11-02',
      time: '19:00',
    });
  });

  it('moves to the next day after local midnight', () => {
    expect(todayInKrakow(new Date('2026-11-02T23:30:00.000Z'))).toBe('2026-11-03');
  });
});

describe('nextWeekday', () => {
  it('finds the coming Saturday', () => {
    expect(nextWeekday(date('2026-11-02'), 5)).toBe('2026-11-07');
  });

  it('skips to next week when today is that weekday', () => {
    expect(nextWeekday(date('2026-11-07'), 5)).toBe(addDays(date('2026-11-07'), 7));
  });
});
