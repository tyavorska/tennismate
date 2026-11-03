import { ntrpRatingSchema, type NewGame } from '@/entities/player';
import type { OfferGameInput } from './offerGameSchema';

/** Turns the form into what the server expects, or undefined when the level is not a valid one. */
export function newGameFromOffer(offer: OfferGameInput): NewGame | undefined {
  const rating = ntrpRatingSchema.safeParse(Number(offer.rating));
  return rating.success ? { ...offer, rating: rating.data } : undefined;
}
