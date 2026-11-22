import { Temporal } from 'temporal-polyfill';
import { z } from 'zod';

// Temporal throws on a string that is not a real date or time ("2026-02-31", "99:99").
function parses(parse: () => void): boolean {
  try {
    parse();
    return true;
  } catch {
    return false;
  }
}

/** A real calendar date as `YYYY-MM-DD`, for a field that stays a plain string. */
export const calendarDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine((value) => parses(() => Temporal.PlainDate.from(value)), 'Enter a real date');

/** The same date, branded so it cannot mix with plain strings. Parsed, never asserted. */
export const isoDateSchema = calendarDateSchema.brand<'IsoDate'>();
export type IsoDate = z.infer<typeof isoDateSchema>;

/** A real time of day as `HH:mm`, from 00:00 to 23:59. */
export const clockTimeSchema = z
  .string()
  .regex(/^\d{2}:\d{2}$/)
  .refine((value) => parses(() => Temporal.PlainTime.from(value)), 'Enter a real time');

/** The date's parts. `month` starts at 1. */
export function toPlainDate(iso: IsoDate): Temporal.PlainDate {
  return Temporal.PlainDate.from(iso);
}

export function addDays(iso: IsoDate, days: number): IsoDate {
  return isoDateSchema.parse(Temporal.PlainDate.from(iso).add({ days }).toString());
}

/** Whole days from one date to another. Negative when `to` is earlier. */
export function daysBetween(from: IsoDate, to: IsoDate): number {
  return Temporal.PlainDate.from(from).until(to).days;
}

/** 0 for Monday up to 6 for Sunday. */
export function weekdayIndex(iso: IsoDate): number {
  return Temporal.PlainDate.from(iso).dayOfWeek - 1;
}
