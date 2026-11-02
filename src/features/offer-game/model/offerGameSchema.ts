import { z } from 'zod';
import { gameDaySchema, gameFormatSchema } from '@/entities/player';

export const offerTimes = ['07:00', '09:00', '12:00', '17:30', '18:30', '19:00', '20:00'] as const;

export const lookingForSchema = z.enum(['nearLevel', 'sameLevel', 'anyLevel']);
export type LookingFor = z.infer<typeof lookingForSchema>;

export const lookingForLabels = {
  nearLevel: 'Any level ±0.5',
  sameLevel: 'My level only',
  anyLevel: 'Any level',
} as const satisfies Record<LookingFor, string>;

export const offerGameSchema = z.object({
  day: gameDaySchema,
  time: z.enum(offerTimes),
  format: gameFormatSchema,
  rating: z.string().min(1),
  court: z.string().min(1, 'Choose a court.'),
  lookingFor: lookingForSchema,
  note: z.string().max(140, 'Keep the note under 140 characters.'),
});
export type OfferGameInput = z.infer<typeof offerGameSchema>;
