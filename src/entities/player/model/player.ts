import { z } from 'zod';

export const playerIdSchema = z.string().min(1).brand<'PlayerId'>();
export type PlayerId = z.infer<typeof playerIdSchema>;

/** NTRP rating, 1.0 to 7.0 in half steps. */
export const ntrpRatingSchema = z.number().min(1).max(7).multipleOf(0.5).brand<'NtrpRating'>();
export type NtrpRating = z.infer<typeof ntrpRatingSchema>;

export const playTimeSchema = z.enum([
  'weekdayMorning',
  'weekdayDaytime',
  'weekdayEvening',
  'weekends',
  'flexible',
]);
export type PlayTime = z.infer<typeof playTimeSchema>;

export const geoPointSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
});
export type GeoPoint = z.infer<typeof geoPointSchema>;

export const playerSchema = z.object({
  id: playerIdSchema,
  name: z.string().min(1),
  rating: ntrpRatingSchema,
  about: z.string(),
  neighborhood: z.string().min(1),
  location: geoPointSchema,
  lastActiveDaysAgo: z.number().int().nonnegative(),
  gamesPlayed: z.number().int().nonnegative(),
  readyToPlay: z.boolean(),
  playTimes: z.array(playTimeSchema).readonly(),
  homeCourts: z.array(z.string().min(1)).readonly(),
});
export type Player = Readonly<z.infer<typeof playerSchema>>;

export const playTimeLabels = {
  weekdayMorning: 'Weekday mornings',
  weekdayDaytime: 'Weekday daytime',
  weekdayEvening: 'Weekday evenings',
  weekends: 'Weekends',
  flexible: 'Flexible',
} as const satisfies Record<PlayTime, string>;

// Lowest rating for each level, in ascending order.
const levels = [
  { minRating: 1, label: 'Beginner' },
  { minRating: 3, label: 'Intermediate' },
  { minRating: 4, label: 'Advanced' },
  { minRating: 5, label: 'Expert' },
] as const;

export function levelOf(rating: NtrpRating): string {
  const reached = levels.filter((level) => rating >= level.minRating);
  return reached.at(-1)?.label ?? levels[0].label;
}

export function initialsOf(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  return words
    .slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase())
    .join('');
}

export function firstNameOf(name: string): string {
  return name.trim().split(/\s+/)[0] ?? name;
}
