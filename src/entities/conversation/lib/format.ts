import { addDays, daysBetween, todayIn } from '@/shared/lib';

function formatter(timeZone: string, options: Intl.DateTimeFormatOptions): Intl.DateTimeFormat {
  return new Intl.DateTimeFormat('en-GB', { timeZone, ...options });
}

/** "Sat 31 Oct" for a plain date such as `2026-10-31`. The date has no time zone. */
export function formatInviteDay(date: string): string {
  return formatter('UTC', { weekday: 'short', day: 'numeric', month: 'short' }).format(
    new Date(`${date}T12:00:00Z`),
  );
}

/** "18:42" in the viewer's city. */
export function formatMessageTime(sentAt: string, timeZone: string): string {
  return formatter(timeZone, { hour: '2-digit', minute: '2-digit', hour12: false }).format(
    new Date(sentAt),
  );
}

/** The time for today's messages, then "Yesterday", the weekday for this week, and the date. */
export function formatListTime(sentAt: string, timeZone: string, now: Date): string {
  const sent = new Date(sentAt);
  const sentDay = todayIn(sent, timeZone);
  const today = todayIn(now, timeZone);
  if (sentDay === today) return formatMessageTime(sentAt, timeZone);
  if (sentDay === addDays(today, -1)) return 'Yesterday';
  if (daysBetween(sentDay, today) < 6)
    return formatter(timeZone, { weekday: 'short' }).format(sent);
  return formatter(timeZone, { day: 'numeric', month: 'short' }).format(sent);
}
