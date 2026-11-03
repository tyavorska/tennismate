import 'server-only';
import type { GameDay } from '@/entities/player';
import { addDays, nextWeekday, toUtc, weekdayIndex, type IsoDate } from '@/shared/lib';

const saturday = 5;
const sunday = 6;
const dayMs = 86_400_000;

/** How far ahead the finder looks: games on later days only show in the calendar. */
export const finderDays = 7;

/** The calendar date a finder day means, counted from today in Kraków. */
export function dateForDay(day: GameDay, today: IsoDate): IsoDate {
  const dates = {
    Today: today,
    Tomorrow: addDays(today, 1),
    Sat: nextWeekday(today, saturday),
    Sun: nextWeekday(today, sunday),
  } as const satisfies Record<GameDay, IsoDate>;
  return dates[day];
}

const finderDayByWeekday: Readonly<Record<number, GameDay>> = {
  [saturday]: 'Sat',
  [sunday]: 'Sun',
};

/** The finder day a date falls on, or nothing when the finder has no name for it. */
export function dayOfDate(date: IsoDate, today: IsoDate): GameDay | undefined {
  const ahead = Math.round((toUtc(date).getTime() - toUtc(today).getTime()) / dayMs);
  if (ahead === 0) return 'Today';
  if (ahead === 1) return 'Tomorrow';
  if (ahead < 0 || ahead > finderDays) return undefined;
  return finderDayByWeekday[weekdayIndex(date)];
}
