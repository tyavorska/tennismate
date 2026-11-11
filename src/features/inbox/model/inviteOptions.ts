import { formatInviteDay } from '@/entities/conversation';
import { addDays, todayIn, type IsoDate } from '@/shared/lib';
import type { SelectOption } from '@/shared/ui';

const daysOffered = 14;
const firstHour = 7;
const lastHour = 21;

/** Half-hour start times through the day. */
export const inviteTimes: readonly SelectOption[] = Array.from(
  { length: (lastHour - firstHour + 1) * 2 },
  (_, index) => {
    const hour = String(firstHour + Math.floor(index / 2)).padStart(2, '0');
    const time = `${hour}:${index % 2 === 0 ? '00' : '30'}`;
    return { id: time, label: time };
  },
);

export const defaultInviteTime = '10:00';

/** The next two weeks in the player's city, starting today. */
export function inviteDays(now: Date, timeZone: string): readonly SelectOption[] {
  const today = todayIn(now, timeZone);
  const names: Readonly<Record<number, string>> = { 0: 'Today', 1: 'Tomorrow' };
  return Array.from({ length: daysOffered }, (_, offset) => {
    const date: IsoDate = addDays(today, offset);
    return { id: date, label: names[offset] ?? formatInviteDay(date) };
  });
}
