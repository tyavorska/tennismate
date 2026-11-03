import { addDays, isoDateSchema, weekdayIndex, type IsoDate } from './isoDate';

const timeZone = 'Europe/Warsaw';

const wallClock = new Intl.DateTimeFormat('en-CA', {
  timeZone,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});

const minuteMs = 60_000;

type WallClock = Readonly<{ date: IsoDate; time: string }>;

function partsOf(instant: Date): Readonly<Record<string, string>> {
  return Object.fromEntries(
    wallClock
      .formatToParts(instant)
      .filter((part) => part.type !== 'literal')
      .map((part) => [part.type, part.value]),
  );
}

/** The date and the `HH:mm` time on the clocks in Kraków at an instant. */
export function toKrakowWallClock(instant: Date): WallClock {
  const { year, month, day, hour, minute } = partsOf(instant);
  return { date: isoDateSchema.parse(`${year}-${month}-${day}`), time: `${hour}:${minute}` };
}

export function todayInKrakow(now: Date): IsoDate {
  return toKrakowWallClock(now).date;
}

function offsetMs(instant: Date): number {
  const { year, month, day, hour, minute } = partsOf(instant);
  const asUtc = Date.UTC(
    Number(year),
    Number(month) - 1,
    Number(day),
    Number(hour),
    Number(minute),
  );
  return asUtc - Math.floor(instant.getTime() / minuteMs) * minuteMs;
}

/** The UTC instant at which the clocks in Kraków show this date and `HH:mm` time. */
export function krakowToUtc(date: IsoDate, time: string): Date {
  const [year = 0, month = 1, day = 1] = date.split('-').map(Number);
  const [hour = 0, minute = 0] = time.split(':').map(Number);
  const wall = Date.UTC(year, month - 1, day, hour, minute);
  const guess = wall - offsetMs(new Date(wall));
  return new Date(wall - offsetMs(new Date(guess)));
}

/** The next date after today that falls on `weekday` (0 Monday to 6 Sunday). */
export function nextWeekday(today: IsoDate, weekday: number): IsoDate {
  const ahead = (weekday - weekdayIndex(today) + 7) % 7 || 7;
  return addDays(today, ahead);
}
