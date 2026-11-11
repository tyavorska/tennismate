const dayMs = 86_400_000;

function formatter(timeZone: string, options: Intl.DateTimeFormatOptions): Intl.DateTimeFormat {
  return new Intl.DateTimeFormat('en-GB', { timeZone, ...options });
}

function dayKey(date: Date, timeZone: string): string {
  return formatter(timeZone, { year: 'numeric', month: '2-digit', day: '2-digit' }).format(date);
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
  if (dayKey(sent, timeZone) === dayKey(now, timeZone)) return formatMessageTime(sentAt, timeZone);
  if (dayKey(sent, timeZone) === dayKey(new Date(now.getTime() - dayMs), timeZone)) {
    return 'Yesterday';
  }
  const ageMs = now.getTime() - sent.getTime();
  if (ageMs < 6 * dayMs) return formatter(timeZone, { weekday: 'short' }).format(sent);
  return formatter(timeZone, { day: 'numeric', month: 'short' }).format(sent);
}
