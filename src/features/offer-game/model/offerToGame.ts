import { ntrpRatingSchema, type OpenGame } from '@/entities/player';
import type { OfferGameInput } from './offerGameSchema';

export type CourtOption = Readonly<{ name: string; district: string }>;

/** Turns the form into a game card, or undefined when the level or court is not a known one. */
export function gameFromOffer(
  offer: OfferGameInput,
  courts: readonly CourtOption[],
  id: string,
): OpenGame | undefined {
  const rating = ntrpRatingSchema.safeParse(Number(offer.rating));
  const court = courts.find((option) => option.name === offer.court);
  if (!rating.success || court === undefined) return undefined;

  return {
    id,
    hostName: 'You',
    hostInitials: 'You',
    rating: rating.data,
    format: offer.format,
    day: offer.day,
    time: offer.time,
    court: court.name,
    district: court.district,
    spotsOpen: offer.format === 'doubles' ? 3 : 1,
    isMine: true,
  };
}
