import { z } from 'zod';

/** A calendar date as `YYYY-MM-DD`. Parsed, never asserted. */
export const isoDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .brand<'IsoDate'>();
export type IsoDate = z.infer<typeof isoDateSchema>;

const dayMs = 86_400_000;

export function toUtc(iso: IsoDate): Date {
  const [year = 0, month = 1, day = 1] = iso.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

export function fromUtc(date: Date): IsoDate {
  return isoDateSchema.parse(date.toISOString().slice(0, 10));
}

export function addDays(iso: IsoDate, days: number): IsoDate {
  return fromUtc(new Date(toUtc(iso).getTime() + days * dayMs));
}

/** 0 for Monday up to 6 for Sunday. */
export function weekdayIndex(iso: IsoDate): number {
  return (toUtc(iso).getUTCDay() + 6) % 7;
}
