import { describe, expect, it } from 'vitest';
import type { z } from 'zod';
import { distanceInMiles, playerSchema, rankMatches, type Player } from '../index';

const centerCity = { latitude: 39.9526, longitude: -75.1652 };

type PlayerInput = z.input<typeof playerSchema>;

function makePlayer(overrides: Partial<PlayerInput> & Pick<PlayerInput, 'id'>): Player {
  return playerSchema.parse({
    name: 'Test Player',
    rating: 3,
    about: '',
    neighborhood: 'Center City',
    location: centerCity,
    lastActiveDaysAgo: 0,
    gamesPlayed: 0,
    readyToPlay: false,
    playTimes: ['weekdayEvening', 'weekends'],
    homeCourts: ['Fairmount Park'],
    ...overrides,
  });
}

const viewer = makePlayer({ id: 'viewer' });

describe('distanceInMiles', () => {
  it('is zero for the same point', () => {
    expect(distanceInMiles(centerCity, centerCity)).toBe(0);
  });

  it('measures Center City to Chestnut Hill as about 9 miles', () => {
    const chestnutHill = { latitude: 40.0766, longitude: -75.2077 };
    expect(distanceInMiles(centerCity, chestnutHill)).toBeCloseTo(8.8, 0);
  });
});

describe('rankMatches', () => {
  it('scores an identical nearby player as a perfect match', () => {
    const [match] = rankMatches(viewer, [makePlayer({ id: 'twin' })]);

    expect(match?.score).toBe(100);
    expect(match?.sharedPlayTimes).toEqual(['weekdayEvening', 'weekends']);
    expect(match?.sharedCourts).toEqual(['Fairmount Park']);
  });

  it('leaves the viewer out of the results', () => {
    const matches = rankMatches(viewer, [viewer, makePlayer({ id: 'other' })]);

    expect(matches.map((match) => match.player.id)).toEqual(['other']);
  });

  it('puts the closest level first when everything else is equal', () => {
    const matches = rankMatches(viewer, [
      makePlayer({ id: 'far-level', rating: 4.5 }),
      makePlayer({ id: 'same-level' }),
      makePlayer({ id: 'near-level', rating: 3.5 }),
    ]);

    expect(matches.map((match) => match.player.id)).toEqual([
      'same-level',
      'near-level',
      'far-level',
    ]);
  });

  it('treats a flexible player as sharing all of the viewer play times', () => {
    const [match] = rankMatches(viewer, [makePlayer({ id: 'flex', playTimes: ['flexible'] })]);

    expect(match?.sharedPlayTimes).toEqual(['weekdayEvening', 'weekends']);
  });

  it('gives no schedule or court points when nothing is shared', () => {
    const [match] = rankMatches(viewer, [
      makePlayer({ id: 'mornings', playTimes: ['weekdayMorning'], homeCourts: ['FDR Park'] }),
    ]);

    expect(match?.sharedPlayTimes).toEqual([]);
    expect(match?.sharedCourts).toEqual([]);
    expect(match?.score).toBe(55);
  });
});
