import { calendarEventSchema } from '@/entities/game';
import type { CalendarEvent } from '@/entities/game';
import { addDays, isoDateSchema, toUtc, weekdayIndex, type IsoDate } from '@/shared/lib';

export { addDays, calendarEventSchema, isoDateSchema, weekdayIndex };
export type { CalendarEvent, IsoDate };

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

/** The week offset that brings a day into view: 0 when it is already within the five weeks shown. */
export function weekOffsetFor(todayIso: IsoDate, iso: IsoDate): number {
  const start = addDays(todayIso, -weekdayIndex(todayIso));
  const diff = Math.round((toUtc(iso).getTime() - toUtc(start).getTime()) / dayMs);
  return diff >= 0 && diff < daysShown ? 0 : Math.floor(diff / 7);
}

/** The first and last day of the five weeks shown, moved by whole weeks. */
export function visibleRange(
  todayIso: IsoDate,
  weekOffset: number,
): Readonly<{ from: IsoDate; to: IsoDate }> {
  const from = addDays(todayIso, -weekdayIndex(todayIso) + weekOffset * 7);
  return { from, to: addDays(from, daysShown - 1) };
}

/** The 35 days shown: five weeks starting on the Monday of the current week, moved by whole weeks. */
export function buildDays(todayIso: IsoDate, weekOffset: number): readonly CalendarDay[] {
  const start = visibleRange(todayIso, weekOffset).from;
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

export function plural(count: number, one: string, many: string): string {
  return `${count} ${count === 1 ? one : many}`;
}
