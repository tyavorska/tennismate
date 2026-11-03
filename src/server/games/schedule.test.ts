// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { isoDateSchema } from '@/shared/lib';
import { dateForDay, dayOfDate } from './schedule';

const date = (iso: string) => isoDateSchema.parse(iso);
const monday = date('2026-11-02');

describe('dateForDay', () => {
  it('maps the finder days to dates', () => {
    expect(dateForDay('Today', monday)).toBe('2026-11-02');
    expect(dateForDay('Tomorrow', monday)).toBe('2026-11-03');
    expect(dateForDay('Sat', monday)).toBe('2026-11-07');
    expect(dateForDay('Sun', monday)).toBe('2026-11-08');
  });
});

describe('dayOfDate', () => {
  it('names today and tomorrow', () => {
    expect(dayOfDate(date('2026-11-02'), monday)).toBe('Today');
    expect(dayOfDate(date('2026-11-03'), monday)).toBe('Tomorrow');
  });

  it('names a coming Saturday and Sunday', () => {
    expect(dayOfDate(date('2026-11-07'), monday)).toBe('Sat');
    expect(dayOfDate(date('2026-11-08'), monday)).toBe('Sun');
  });

  it('has no name for other weekdays, for the past or for dates beyond a week', () => {
    expect(dayOfDate(date('2026-11-05'), monday)).toBe(undefined);
    expect(dayOfDate(date('2026-11-01'), monday)).toBe(undefined);
    expect(dayOfDate(date('2026-11-14'), monday)).toBe(undefined);
  });
});
