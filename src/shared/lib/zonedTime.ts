import { addDays, isoDateSchema, weekdayIndex, type IsoDate } from './isoDate';

const minuteMs = 60_000;

type WallClock = Readonly<{ date: IsoDate; time: string }>;

const formatters = new Map<string, Intl.DateTimeFormat>();

function formatterFor(timeZone: string): Intl.DateTimeFormat {
  const cached = formatters.get(timeZone);
  if (cached !== undefined) return cached;

  const created = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  });
  formatters.set(timeZone, created);
  return created;
}

function partsOf(instant: Date, timeZone: string): Readonly<Record<string, string>> {
  return Object.fromEntries(
    formatterFor(timeZone)
      .formatToParts(instant)
      .filter((part) => part.type !== 'literal')
      .map((part) => [part.type, part.value]),
  );
}

/** The date and the `HH:mm` time on the clocks in a time zone (an IANA name) at an instant. */
export function toWallClock(instant: Date, timeZone: string): WallClock {
  const { year, month, day, hour, minute } = partsOf(instant, timeZone);
  return { date: isoDateSchema.parse(`${year}-${month}-${day}`), time: `${hour}:${minute}` };
}

export function todayIn(now: Date, timeZone: string): IsoDate {
  return toWallClock(now, timeZone).date;
}

function offsetMs(instant: Date, timeZone: string): number {
  const { year, month, day, hour, minute } = partsOf(instant, timeZone);
  const asUtc = Date.UTC(
    Number(year),
    Number(month) - 1,
    Number(day),
    Number(hour),
    Number(minute),
  );
  return asUtc - Math.floor(instant.getTime() / minuteMs) * minuteMs;
}

/** The UTC instant at which the clocks in a time zone show this date and `HH:mm` time. */
export function zonedToUtc(date: IsoDate, time: string, timeZone: string): Date {
  const [year = 0, month = 1, day = 1] = date.split('-').map(Number);
  const [hour = 0, minute = 0] = time.split(':').map(Number);
  const wall = Date.UTC(year, month - 1, day, hour, minute);
  const guess = wall - offsetMs(new Date(wall), timeZone);
  return new Date(wall - offsetMs(new Date(guess), timeZone));
}

/** The next date after today that falls on `weekday` (0 Monday to 6 Sunday). */
export function nextWeekday(today: IsoDate, weekday: number): IsoDate {
  const ahead = (weekday - weekdayIndex(today) + 7) % 7 || 7;
  return addDays(today, ahead);
}
