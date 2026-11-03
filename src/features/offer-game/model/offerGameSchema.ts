import { z } from 'zod';
import { gameDaySchema, gameFormatSchema, gameTimes, lookingForSchema } from '@/entities/player';

export const offerTimes = gameTimes;

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
