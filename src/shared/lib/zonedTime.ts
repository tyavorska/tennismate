import { Temporal } from 'temporal-polyfill';
import { addDays, isoDateSchema, weekdayIndex, type IsoDate } from './isoDate';

type WallClock = Readonly<{ date: IsoDate; time: string }>;

/** The date and the `HH:mm` time on the clocks in a time zone (an IANA name) at an instant. */
export function toWallClock(instant: Date, timeZone: string): WallClock {
  const zoned = Temporal.Instant.fromEpochMilliseconds(instant.getTime()).toZonedDateTimeISO(
    timeZone,
  );
  return {
    date: isoDateSchema.parse(zoned.toPlainDate().toString()),
    time: zoned.toPlainTime().toString({ smallestUnit: 'minute' }),
  };
}

export function todayIn(now: Date, timeZone: string): IsoDate {
  return toWallClock(now, timeZone).date;
}

/** The UTC instant at which the clocks in a time zone show this date and `HH:mm` time. */
export function zonedToUtc(date: IsoDate, time: string, timeZone: string): Date {
  const zoned = Temporal.PlainDate.from(date).toZonedDateTime({
    timeZone,
    plainTime: Temporal.PlainTime.from(time),
  });
  return new Date(zoned.epochMilliseconds);
}

/** The UTC instant at which a date ends in a time zone: midnight at the start of the next day. */
export function endOfDayUtc(date: IsoDate, timeZone: string): Date {
  const nextDay = Temporal.PlainDate.from(date).add({ days: 1 });
  return new Date(nextDay.toZonedDateTime(timeZone).epochMilliseconds);
}

/** The next date after today that falls on `weekday` (0 Monday to 6 Sunday). */
export function nextWeekday(today: IsoDate, weekday: number): IsoDate {
  const ahead = (weekday - weekdayIndex(today) + 7) % 7 || 7;
  return addDays(today, ahead);
}
