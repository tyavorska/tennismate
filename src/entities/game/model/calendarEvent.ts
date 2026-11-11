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
