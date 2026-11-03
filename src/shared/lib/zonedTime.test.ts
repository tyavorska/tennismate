import { describe, expect, it } from 'vitest';
import { addDays, isoDateSchema } from './isoDate';
import { nextWeekday, todayIn, toWallClock, zonedToUtc } from './zonedTime';

const date = (iso: string) => isoDateSchema.parse(iso);
const warsaw = 'Europe/Warsaw';

describe('zonedToUtc', () => {
  it('uses UTC+1 in Kraków in winter', () => {
    expect(zonedToUtc(date('2026-11-02'), '19:00', warsaw).toISOString()).toBe(
      '2026-11-02T18:00:00.000Z',
    );
  });

  it('uses UTC+2 in Kraków in summer', () => {
    expect(zonedToUtc(date('2026-07-15'), '19:00', warsaw).toISOString()).toBe(
      '2026-07-15T17:00:00.000Z',
    );
  });

  it('follows the clocks on the day they change', () => {
    expect(zonedToUtc(date('2026-03-29'), '10:00', warsaw).toISOString()).toBe(
      '2026-03-29T08:00:00.000Z',
    );
    expect(zonedToUtc(date('2026-10-25'), '10:00', warsaw).toISOString()).toBe(
      '2026-10-25T09:00:00.000Z',
    );
  });

  it('uses the zone it is given: London is an hour behind Kraków', () => {
    expect(zonedToUtc(date('2026-11-02'), '19:00', 'Europe/London').toISOString()).toBe(
      '2026-11-02T19:00:00.000Z',
    );
    expect(zonedToUtc(date('2026-07-15'), '19:00', 'Europe/London').toISOString()).toBe(
      '2026-07-15T18:00:00.000Z',
    );
  });

  it('works for a zone two hours ahead', () => {
    expect(zonedToUtc(date('2026-11-02'), '19:00', 'Europe/Athens').toISOString()).toBe(
      '2026-11-02T17:00:00.000Z',
    );
  });
});

describe('toWallClock', () => {
  it('turns a UTC instant back into the local date and time', () => {
    expect(toWallClock(new Date('2026-11-02T18:00:00.000Z'), warsaw)).toEqual({
      date: '2026-11-02',
      time: '19:00',
    });
  });

  it('gives a different answer for another zone', () => {
    expect(toWallClock(new Date('2026-11-02T18:00:00.000Z'), 'Europe/London')).toEqual({
      date: '2026-11-02',
      time: '18:00',
    });
  });
});

describe('todayIn', () => {
  it('moves to the next day after local midnight, which differs by zone', () => {
    const instant = new Date('2026-11-02T23:30:00.000Z');

    expect(todayIn(instant, warsaw)).toBe('2026-11-03');
    expect(todayIn(instant, 'Europe/London')).toBe('2026-11-02');
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
