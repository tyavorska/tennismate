import { z } from 'zod';
import { ntrpRatingSchema, type Player } from '@/entities/player';

export const editProfileSchema = z.object({
  name: z.string().trim().min(1, 'Enter your name'),
  neighborhood: z.string().trim().min(1, 'Enter your home district'),
  rating: ntrpRatingSchema,
});

export type EditProfileInput = z.input<typeof editProfileSchema>;

export function editProfileDefaults(viewer: Player): EditProfileInput {
  return { name: viewer.name, neighborhood: viewer.neighborhood, rating: viewer.rating };
}
