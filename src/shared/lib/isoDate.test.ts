import { describe, expect, it } from 'vitest';
import { addDays, clockTimeSchema, daysBetween, isoDateSchema, weekdayIndex } from './isoDate';

const date = (iso: string) => isoDateSchema.parse(iso);

describe('isoDateSchema', () => {
  it.each(['2026-11-02', '2028-02-29'])('accepts %s', (value) => {
    expect(isoDateSchema.safeParse(value).success).toBe(true);
  });

  it.each(['2026-02-31', '2027-02-29', '2026-13-01', '0000-00-00', '9999-99-99', '2026-1-1'])(
    'rejects %s, which is not a real date',
    (value) => {
      expect(isoDateSchema.safeParse(value).success).toBe(false);
    },
  );
});

describe('clockTimeSchema', () => {
  it.each(['00:00', '23:59'])('accepts %s', (value) => {
    expect(clockTimeSchema.safeParse(value).success).toBe(true);
  });

  it.each(['24:00', '99:99', '12:60', '7:00'])('rejects %s, which is not a real time', (value) => {
    expect(clockTimeSchema.safeParse(value).success).toBe(false);
  });
});

describe('date arithmetic', () => {
  it('adds days across a month and a leap day', () => {
    expect(addDays(date('2028-02-28'), 2)).toBe('2028-03-01');
    expect(addDays(date('2026-11-01'), -1)).toBe('2026-10-31');
  });

  it('counts whole days between two dates, also across a clock change', () => {
    expect(daysBetween(date('2026-10-24'), date('2026-10-26'))).toBe(2);
    expect(daysBetween(date('2026-01-01'), date('2029-01-01'))).toBe(1096);
    expect(daysBetween(date('2026-11-02'), date('2026-11-01'))).toBe(-1);
  });

  it('numbers weekdays from Monday', () => {
    expect(weekdayIndex(date('2026-11-02'))).toBe(0);
    expect(weekdayIndex(date('2026-11-08'))).toBe(6);
  });
});
