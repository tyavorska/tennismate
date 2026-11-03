import { describe, expect, it } from 'vitest';
import {
  addDays,
  buildDays,
  describeDay,
  eventsOn,
  formatDay,
  freeOn,
  freePlayerSchema,
  isoDateSchema,
  rangeTitle,
  weekdayIndex,
  weekOffsetFor,
  calendarEventSchema,
} from './calendar';

const iso = (value: string) => isoDateSchema.parse(value);
const monday = iso('2026-11-02');

describe('addDays', () => {
  it('moves across month and year ends', () => {
    expect(addDays(iso('2026-11-30'), 1)).toBe('2026-12-01');
    expect(addDays(iso('2026-12-31'), 1)).toBe('2027-01-01');
    expect(addDays(iso('2026-03-01'), -1)).toBe('2026-02-28');
  });
});

describe('weekdayIndex', () => {
  it('counts Monday as 0 and Sunday as 6', () => {
    expect(weekdayIndex(monday)).toBe(0);
    expect(weekdayIndex(iso('2026-11-08'))).toBe(6);
  });
});

describe('buildDays', () => {
  it('shows five weeks that start on the Monday of the current week', () => {
    const days = buildDays(iso('2026-11-04'), 0);

    expect(days).toHaveLength(35);
    expect(days[0]?.iso).toBe('2026-11-02');
    expect(days.at(-1)?.iso).toBe('2026-12-06');
  });

  it('marks today and the days before it', () => {
    const days = buildDays(iso('2026-11-04'), 0);

    expect(days.filter((day) => day.isToday).map((day) => day.iso)).toEqual(['2026-11-04']);
    expect(days.filter((day) => day.isPast).map((day) => day.iso)).toEqual([
      '2026-11-02',
      '2026-11-03',
    ]);
  });

  it('moves by whole weeks', () => {
    expect(buildDays(monday, 1)[0]?.iso).toBe('2026-11-09');
    expect(buildDays(monday, -2)[0]?.iso).toBe('2026-10-19');
  });

  it('names the month on every day so the first of a month can be labelled', () => {
    const days = buildDays(monday, 0);

    expect(days[0]).toMatchObject({ dayOfMonth: 2, month: 'Nov' });
    expect(days.find((day) => day.dayOfMonth === 1)).toMatchObject({ month: 'Dec' });
  });
});

describe('rangeTitle', () => {
  it('writes the first and last day with the year', () => {
    expect(rangeTitle(buildDays(monday, 0))).toBe('2 Nov – 6 Dec 2026');
  });
});

describe('formatDay and describeDay', () => {
  it('formats a date as weekday, day and month', () => {
    expect(formatDay(monday)).toBe('Mon, 2 Nov');
  });

  it('says Today, Tomorrow or the weekday', () => {
    expect(describeDay(monday, monday)).toBe('Today');
    expect(describeDay(iso('2026-11-03'), monday)).toBe('Tomorrow');
    expect(describeDay(iso('2026-11-07'), monday)).toBe('Saturday');
  });
});

describe('eventsOn', () => {
  it('keeps only the events of that day', () => {
    const events = [
      calendarEventSchema.parse({
        id: 'a',
        kind: 'tournament',
        date: '2026-11-15',
        name: 'Autumn Open',
        venue: 'Cracovia',
      }),
      calendarEventSchema.parse({
        id: 'b',
        kind: 'game',
        date: '2026-11-02',
        time: '19:00',
        title: 'Piotr W.',
        court: 'Kazimierz',
        confirmed: true,
      }),
    ];

    expect(eventsOn(events, monday).map((event) => event.id)).toEqual(['b']);
  });
});

describe('freeOn', () => {
  const players = [
    freePlayerSchema.parse({
      id: 'a',
      name: 'Marta K.',
      initials: 'MK',
      rating: 3.5,
      window: 'Free 18:00–21:00',
      district: 'Podgórze',
      weekdays: [0, 2],
    }),
    freePlayerSchema.parse({
      id: 'b',
      name: 'Ola N.',
      initials: 'ON',
      rating: 3,
      window: 'Free 17:00–20:00',
      district: 'Nowa Huta',
      weekdays: [1],
    }),
  ];

  it('lists the players free on that weekday', () => {
    expect(freeOn(players, monday, monday).map((player) => player.id)).toEqual(['a']);
  });

  it('lists nobody for a day that has passed', () => {
    expect(freeOn(players, monday, iso('2026-11-03'))).toEqual([]);
  });
});

describe('weekOffsetFor', () => {
  it('needs no move for a day within the five weeks shown', () => {
    expect(weekOffsetFor(monday, iso('2026-11-02'))).toBe(0);
    expect(weekOffsetFor(monday, iso('2026-12-06'))).toBe(0);
  });

  it('moves forward by whole weeks for a later day', () => {
    expect(weekOffsetFor(monday, iso('2026-12-07'))).toBe(5);
  });

  it('moves back for a day before this week', () => {
    expect(weekOffsetFor(monday, iso('2026-10-30'))).toBe(-1);
  });
});
