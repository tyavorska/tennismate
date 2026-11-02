import { z } from 'zod';
import { ntrpRatingSchema, playerIdSchema } from './player';

export const playFormatSchema = z.enum(['singles', 'doubles']);
export type PlayFormat = z.infer<typeof playFormatSchema>;

export const matchTimeSchema = z.enum(['tonight', 'mornings', 'weekends']);
export type MatchTime = z.infer<typeof matchTimeSchema>;

/** A player as shown in the finder: the profile facts plus how well they fit the viewer. */
export const playerListingSchema = z.object({
  id: playerIdSchema,
  name: z.string().min(1),
  age: z.number().int().positive(),
  rating: ntrpRatingSchema,
  district: z.string().min(1),
  distanceKm: z.number().nonnegative(),
  fitPercent: z.number().int().min(0).max(100),
  playStyle: z.string().min(1),
  formats: z.array(playFormatSchema).min(1).readonly(),
  times: z.array(matchTimeSchema).readonly(),
  freeTonight: z.boolean(),
  online: z.boolean(),
  isNew: z.boolean(),
  wantsDoublesPartner: z.boolean(),
});
export type PlayerListing = Readonly<z.infer<typeof playerListingSchema>>;

export const playFormatLabels = {
  singles: 'Singles',
  doubles: 'Doubles',
} as const satisfies Record<PlayFormat, string>;

export function formatsLabel(formats: readonly PlayFormat[]): string {
  return playFormatSchema.options
    .filter((format) => formats.includes(format))
    .map((format) => playFormatLabels[format])
    .join(' / ');
}
