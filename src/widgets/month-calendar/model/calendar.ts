import { z } from 'zod';

/** A calendar date as `YYYY-MM-DD`. Parsed, never asserted. */
export const isoDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .brand<'IsoDate'>();
export type IsoDate = z.infer<typeof isoDateSchema>;

const timeSchema = z.string().regex(/^\d{2}:\d{2}$/);

export const calendarEventSchema = z.discriminatedUnion('kind', [
  z.object({
    id: z.string().min(1),
    kind: z.literal('game'),
    date: isoDateSchema,
    time: timeSchema,
    title: z.string().min(1),
    court: z.string().min(1),
    confirmed: z.boolean(),
  }),
  z.object({
    id: z.string().min(1),
    kind: z.literal('tournament'),
    date: isoDateSchema,
    name: z.string().min(1),
    venue: z.string().min(1),
  }),
  z.object({
    id: z.string().min(1),
    kind: z.literal('open'),
    date: isoDateSchema,
    time: timeSchema,
    host: z.string().min(1),
    court: z.string().min(1),
    format: z.string().min(1),
  }),
]);
export type CalendarEvent = Readonly<z.infer<typeof calendarEventSchema>>;

/** Weekdays are 0 (Monday) to 6 (Sunday). */
export const freePlayerSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  initials: z.string().min(1),
  rating: z.number(),
  window: z.string().min(1),
  district: z.string().min(1),
  weekdays: z.array(z.number().int().min(0).max(6)).readonly(),
});
export type FreePlayer = Readonly<z.infer<typeof freePlayerSchema>>;

export type CalendarDay = {
  readonly iso: IsoDate;
  readonly dayOfMonth: number;
  readonly month: string;
  readonly isPast: boolean;
  readonly isToday: boolean;
};

const monthNames = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
] as const;
const weekdayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;
const weekdayLongNames = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
] as const;

const dayMs = 86_400_000;
const daysShown = 35;

function toUtc(iso: IsoDate): Date {
  const [year = 0, month = 1, day = 1] = iso.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

function fromUtc(date: Date): IsoDate {
  return isoDateSchema.parse(date.toISOString().slice(0, 10));
}

export function addDays(iso: IsoDate, days: number): IsoDate {
  return fromUtc(new Date(toUtc(iso).getTime() + days * dayMs));
}

/** The week offset that brings a day into view: 0 when it is already within the five weeks shown. */
export function weekOffsetFor(todayIso: IsoDate, iso: IsoDate): number {
  const start = addDays(todayIso, -weekdayIndex(todayIso));
  const diff = Math.round((toUtc(iso).getTime() - toUtc(start).getTime()) / dayMs);
  return diff >= 0 && diff < daysShown ? 0 : Math.floor(diff / 7);
}

/** 0 for Monday up to 6 for Sunday. */
export function weekdayIndex(iso: IsoDate): number {
  return (toUtc(iso).getUTCDay() + 6) % 7;
}

/** The 35 days shown: five weeks starting on the Monday of the current week, moved by whole weeks. */
export function buildDays(todayIso: IsoDate, weekOffset: number): readonly CalendarDay[] {
  const start = addDays(todayIso, -weekdayIndex(todayIso) + weekOffset * 7);
  return Array.from({ length: daysShown }, (_, index) => {
    const iso = addDays(start, index);
    const date = toUtc(iso);
    return {
      iso,
      dayOfMonth: date.getUTCDate(),
      month: monthNames[date.getUTCMonth()] ?? '',
      isPast: iso < todayIso,
      isToday: iso === todayIso,
    };
  });
}

export function rangeTitle(days: readonly CalendarDay[]): string {
  const first = days[0];
  const last = days.at(-1);
  if (first === undefined || last === undefined) return '';
  const year = toUtc(last.iso).getUTCFullYear();
  return `${first.dayOfMonth} ${first.month} – ${last.dayOfMonth} ${last.month} ${year}`;
}

/** "Mon, 2 Nov". */
export function formatDay(iso: IsoDate): string {
  const date = toUtc(iso);
  return `${weekdayNames[weekdayIndex(iso)]}, ${date.getUTCDate()} ${monthNames[date.getUTCMonth()]}`;
}

/** "Today", "Tomorrow" or the weekday name. */
export function describeDay(iso: IsoDate, todayIso: IsoDate): string {
  if (iso === todayIso) return 'Today';
  if (iso === addDays(todayIso, 1)) return 'Tomorrow';
  return weekdayLongNames[weekdayIndex(iso)] ?? '';
}

export function eventsOn(events: readonly CalendarEvent[], iso: IsoDate): readonly CalendarEvent[] {
  return events.filter((event) => event.date === iso);
}

/** Players who are free on a day. Nobody is free on a day that has passed. */
export function freeOn(
  players: readonly FreePlayer[],
  iso: IsoDate,
  todayIso: IsoDate,
): readonly FreePlayer[] {
  if (iso < todayIso) return [];
  const weekday = weekdayIndex(iso);
  return players.filter((player) => player.weekdays.includes(weekday));
}

export function plural(count: number, one: string, many: string): string {
  return `${count} ${count === 1 ? one : many}`;
}
