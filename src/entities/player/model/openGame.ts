import { z } from 'zod';
import { ntrpRatingSchema } from './player';

export const gameDaySchema = z.enum(['Today', 'Tomorrow', 'Sat', 'Sun']);
export type GameDay = z.infer<typeof gameDaySchema>;

export const gameFormatSchema = z.enum(['singles', 'doubles', 'hitting']);
export type GameFormat = z.infer<typeof gameFormatSchema>;

export const openGameSchema = z.object({
  id: z.string().min(1),
  hostName: z.string().min(1),
  hostInitials: z.string().min(1),
  rating: ntrpRatingSchema,
  format: gameFormatSchema,
  day: gameDaySchema,
  time: z.string().regex(/^\d{2}:\d{2}$/),
  court: z.string().min(1),
  district: z.string().min(1),
  spotsOpen: z.number().int().nonnegative(),
  isMine: z.boolean(),
});
export type OpenGame = Readonly<z.infer<typeof openGameSchema>>;

export const gameFormatLabels = {
  singles: 'Singles',
  doubles: 'Doubles',
  hitting: 'Hitting / drills',
} as const satisfies Record<GameFormat, string>;

export const gameDayBadges = {
  Today: 'Today',
  Tomorrow: 'Tmrw',
  Sat: 'Sat',
  Sun: 'Sun',
} as const satisfies Record<GameDay, string>;

export function formatSpots(spotsOpen: number): string {
  if (spotsOpen === 0) return 'Full';
  return spotsOpen === 1 ? '1 spot open' : `${spotsOpen} spots open`;
}
