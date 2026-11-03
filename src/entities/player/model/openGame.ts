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
  isJoined: z.boolean(),
});
export type OpenGame = Readonly<z.infer<typeof openGameSchema>>;

export const gameTimes = ['07:00', '09:00', '12:00', '17:30', '18:30', '19:00', '20:00'] as const;

export const lookingForSchema = z.enum(['nearLevel', 'sameLevel', 'anyLevel']);
export type LookingFor = z.infer<typeof lookingForSchema>;

export const lookingForLabels = {
  nearLevel: 'Any level ±0.5',
  sameLevel: 'My level only',
  anyLevel: 'Any level',
} as const satisfies Record<LookingFor, string>;

/** What a player sends to offer a game; the server turns the day and time into a date. */
export const newGameSchema = z.object({
  day: gameDaySchema,
  time: z.enum(gameTimes),
  format: gameFormatSchema,
  rating: ntrpRatingSchema,
  court: z.string().min(1, 'Choose a court.'),
  lookingFor: lookingForSchema,
  note: z.string().max(140, 'Keep the note under 140 characters.'),
});
export type NewGame = z.infer<typeof newGameSchema>;

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
