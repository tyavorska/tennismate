import { z } from 'zod';

export const nextGameSchema = z.object({
  id: z.string().min(1),
  /** The day of the game as `YYYY-MM-DD`. */
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  weekday: z.string().min(1),
  day: z.string().min(1),
  title: z.string().min(1),
  details: z.string().min(1),
  status: z.enum(['confirmed', 'waiting']),
});
export type NextGame = Readonly<z.infer<typeof nextGameSchema>>;

/** Sample data for "Next games" until bookings come from the backend. */
export const sampleNextGames: readonly NextGame[] = z.array(nextGameSchema).parse([
  {
    id: 'vs-piotr',
    date: '2026-11-02',
    weekday: 'Today',
    day: '2',
    title: 'vs Piotr W.',
    details: '19:00 · Kazimierz Clay Club',
    status: 'confirmed',
  },
  {
    id: 'vs-ola',
    date: '2026-11-04',
    weekday: 'Wed',
    day: '4',
    title: 'vs Ola N.',
    details: '18:30 · Cracovia Tennis Club',
    status: 'confirmed',
  },
  {
    id: 'doubles-open',
    date: '2026-11-07',
    weekday: 'Sat',
    day: '7',
    title: 'Doubles open',
    details: '10:00 · Park Jordana',
    status: 'waiting',
  },
]);
