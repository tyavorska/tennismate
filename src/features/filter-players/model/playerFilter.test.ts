import { describe, expect, it } from 'vitest';
import { playerSchema, type PlayerMatch } from '@/entities/player';
import { filterMatches } from '../index';

function makeMatch(id: string, readyToPlay: boolean, distanceMiles: number): PlayerMatch {
  const player = playerSchema.parse({
    id,
    name: id,
    rating: 3,
    about: '',
    neighborhood: 'Center City',
    location: { latitude: 39.95, longitude: -75.16 },
    lastActiveDaysAgo: 0,
    gamesPlayed: 0,
    readyToPlay,
    playTimes: [],
    homeCourts: [],
  });
  return { player, score: 50, distanceMiles, sharedPlayTimes: [], sharedCourts: [] };
}

const matches = [
  makeMatch('ready-far', true, 9),
  makeMatch('busy-near', false, 1),
  makeMatch('ready-near', true, 4.9),
];

const ids = (list: readonly PlayerMatch[]): string[] => list.map((match) => match.player.id);

describe('filterMatches', () => {
  it('keeps every match in ranking order for best match', () => {
    expect(ids(filterMatches(matches, 'bestMatch'))).toEqual([
      'ready-far',
      'busy-near',
      'ready-near',
    ]);
  });

  it('keeps only players who are ready to play', () => {
    expect(ids(filterMatches(matches, 'readyToPlay'))).toEqual(['ready-far', 'ready-near']);
  });

  it('keeps only players within five miles', () => {
    expect(ids(filterMatches(matches, 'nearby'))).toEqual(['busy-near', 'ready-near']);
  });
});
