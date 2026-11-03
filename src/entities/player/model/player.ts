import { z } from 'zod';

export const playerIdSchema = z.string().min(1).brand<'PlayerId'>();
export type PlayerId = z.infer<typeof playerIdSchema>;

/** NTRP rating, 1.0 to 7.0 in half steps. */
export const ntrpRatingSchema = z.number().min(1).max(7).multipleOf(0.5).brand<'NtrpRating'>();
export type NtrpRating = z.infer<typeof ntrpRatingSchema>;

export const profileUpdateSchema = z.object({
  name: z.string().trim().min(1, 'Enter your name'),
  neighborhood: z.string().trim().min(1, 'Enter your home district'),
  rating: ntrpRatingSchema,
});
export type ProfileUpdate = z.infer<typeof profileUpdateSchema>;

export const playerSchema = z.object({
  id: playerIdSchema,
  name: z.string().min(1),
  rating: ntrpRatingSchema,
  neighborhood: z.string().min(1),
  /** The city the player plays in. Everything the player sees is limited to it. */
  city: z.object({ id: z.number().int().positive(), name: z.string().min(1) }),
});
export type Player = Readonly<z.infer<typeof playerSchema>>;

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
