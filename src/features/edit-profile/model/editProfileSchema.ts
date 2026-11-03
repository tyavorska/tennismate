import type { z } from 'zod';
import { profileUpdateSchema, type Player } from '@/entities/player';

export const editProfileSchema = profileUpdateSchema;

export type EditProfileInput = z.input<typeof editProfileSchema>;

export function editProfileDefaults(viewer: Player): EditProfileInput {
  return { name: viewer.name, neighborhood: viewer.neighborhood, rating: viewer.rating };
}
