import { z } from 'zod';
import type { PlayerMatch } from '@/entities/player';

export const playerFilterSchema = z.enum(['bestMatch', 'readyToPlay', 'nearby']);
export type PlayerFilter = z.infer<typeof playerFilterSchema>;

export const defaultPlayerFilter: PlayerFilter = 'bestMatch';

/** Players within this distance count as nearby. */
export const nearbyMiles = 5;

const predicates = {
  bestMatch: () => true,
  readyToPlay: (match) => match.player.readyToPlay,
  nearby: (match) => match.distanceMiles <= nearbyMiles,
} as const satisfies Record<PlayerFilter, (match: PlayerMatch) => boolean>;

export const playerFilterLabels = {
  bestMatch: 'Best match',
  readyToPlay: 'Ready to play',
  nearby: 'Nearby',
} as const satisfies Record<PlayerFilter, string>;

/** Keeps the ranking order; only removes the matches the filter excludes. */
export function filterMatches(
  matches: readonly PlayerMatch[],
  filter: PlayerFilter,
): readonly PlayerMatch[] {
  return matches.filter(predicates[filter]);
}
