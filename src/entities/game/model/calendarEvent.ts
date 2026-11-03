import { z } from 'zod';
import { isoDateSchema } from '@/shared/lib';

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
