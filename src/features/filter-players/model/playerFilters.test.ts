import { describe, expect, it } from 'vitest';
import type { z } from 'zod';
import {
  ntrpRatingSchema,
  openGameSchema,
  playerListingSchema,
  type OpenGame,
  type PlayerListing,
} from '@/entities/player';
import {
  defaultFilters,
  districtsOf,
  emptyFilters,
  filterGames,
  filterPlayers,
  ladderOf,
  sortPlayers,
  type FilterContext,
  type PlayerFilters,
} from './playerFilters';

type PlayerInput = Partial<z.input<typeof playerListingSchema>> & { id: string };
type GameInput = Partial<z.input<typeof openGameSchema>> & { id: string };

function player(overrides: PlayerInput): PlayerListing {
  return playerListingSchema.parse({
    name: overrides.id,
    age: 30,
    rating: 3.5,
    district: 'Podgórze',
    distanceKm: 2,
    fitPercent: 80,
    playStyle: 'Match play',
    formats: ['singles'],
    times: [],
    freeTonight: false,
    online: false,
    isNew: false,
    wantsDoublesPartner: false,
    ...overrides,
  });
}

function game(overrides: GameInput): OpenGame {
  return openGameSchema.parse({
    hostName: 'Piotr W.',
    hostInitials: 'PW',
    rating: 3.5,
    format: 'singles',
    day: 'Today',
    time: '19:00',
    court: 'Kazimierz Clay Club',
    district: 'Kazimierz',
    spotsOpen: 1,
    isMine: false,
    isJoined: false,
    ...overrides,
  });
}

const context: FilterContext = {
  viewerRating: ntrpRatingSchema.parse(3.5),
  savedIds: new Set(),
  courts: [
    { name: 'Kazimierz Clay Club', district: 'Kazimierz' },
    { name: 'Park Jordana', district: 'Krowodrza' },
  ],
};

function withFilters(overrides: Partial<PlayerFilters>): PlayerFilters {
  return { ...emptyFilters, ...overrides };
}

const players = [
  player({ id: 'low', rating: 2.5 }),
  player({ id: 'same', rating: 3.5, freeTonight: true }),
  player({
    id: 'near',
    rating: 4,
    district: 'Kazimierz',
    formats: ['doubles'],
    wantsDoublesPartner: true,
  }),
  player({ id: 'high', rating: 5, times: ['weekends'], isNew: true }),
];

function idsOf(list: readonly PlayerListing[]): readonly string[] {
  return list.map((entry) => entry.id);
}

describe('filterPlayers', () => {
  it('keeps everyone when no filter is set', () => {
    expect(idsOf(filterPlayers(players, emptyFilters, context))).toEqual([
      'low',
      'same',
      'near',
      'high',
    ]);
  });

  it('keeps players within half a level of the viewer for "At your level"', () => {
    const result = filterPlayers(players, defaultFilters, context);

    expect(idsOf(result)).toEqual(['same', 'near']);
  });

  it('keeps only the chosen level when a rung is picked', () => {
    const level = ntrpRatingSchema.parse(5);

    expect(idsOf(filterPlayers(players, withFilters({ level }), context))).toEqual(['high']);
  });

  it('keeps players who are free tonight for both the list and the Tonight chip', () => {
    const list = withFilters({ lists: new Set(['freeTonight']) });
    const chip = withFilters({ times: new Set(['tonight']) });

    expect(idsOf(filterPlayers(players, list, context))).toEqual(['same']);
    expect(idsOf(filterPlayers(players, chip, context))).toEqual(['same']);
  });

  it('keeps players who match any chosen format', () => {
    const filters = withFilters({ formats: new Set(['doubles']) });

    expect(idsOf(filterPlayers(players, filters, context))).toEqual(['near']);
  });

  it('keeps players in any of the chosen districts', () => {
    const filters = withFilters({ districts: new Set(['Kazimierz']) });

    expect(idsOf(filterPlayers(players, filters, context))).toEqual(['near']);
  });

  it('keeps players from every district that is ticked, not only one', () => {
    const filters = withFilters({ districts: new Set(['Kazimierz', 'Podgórze']) });

    expect(filterPlayers(players, filters, context).length).toBe(players.length);
  });

  it('keeps players whose district holds a chosen court', () => {
    const filters = withFilters({ courts: new Set(['Kazimierz Clay Club']) });

    expect(idsOf(filterPlayers(players, filters, context))).toEqual(['near']);
  });

  it('matches the search text against name, district and playing style', () => {
    expect(idsOf(filterPlayers(players, withFilters({ query: 'KAZIM' }), context))).toEqual([
      'near',
    ]);
    expect(
      idsOf(filterPlayers(players, withFilters({ query: 'match play' }), context)),
    ).toHaveLength(4);
  });

  it('requires every checked list to match', () => {
    const filters = withFilters({ lists: new Set(['atYourLevel', 'needsDoublesPartner']) });

    expect(idsOf(filterPlayers(players, filters, context))).toEqual(['near']);
  });

  it('keeps only saved players for "Saved players"', () => {
    const filters = withFilters({ lists: new Set(['savedPlayers']) });
    const saved = { ...context, savedIds: new Set(['high']) };

    expect(idsOf(filterPlayers(players, filters, saved))).toEqual(['high']);
  });

  it('keeps players one step above the viewer for "Step up a level"', () => {
    const filters = withFilters({ lists: new Set(['stepUpLevel']) });

    expect(idsOf(filterPlayers(players, filters, context))).toEqual(['near']);
  });

  it('keeps new players for "New in Kraków"', () => {
    const filters = withFilters({ lists: new Set(['newInKrakow']) });

    expect(idsOf(filterPlayers(players, filters, context))).toEqual(['high']);
  });

  it('does not change the order or mutate the input', () => {
    const before = [...players];

    filterPlayers(players, emptyFilters, context);

    expect(players).toEqual(before);
  });
});

describe('filterGames', () => {
  const games = [
    game({ id: 'tonight' }),
    game({
      id: 'weekend',
      day: 'Sat',
      time: '10:00',
      format: 'hitting',
      rating: 4,
      district: 'Krowodrza',
      court: 'Park Jordana',
    }),
    game({ id: 'doubles', day: 'Tomorrow', time: '08:00', format: 'doubles', rating: 3 }),
  ];

  function gameIds(filters: PlayerFilters): readonly string[] {
    return filterGames(games, filters, context).map((entry) => entry.id);
  }

  it('keeps games within half a level of the viewer for "At your level"', () => {
    expect(gameIds(defaultFilters)).toEqual(['tonight', 'weekend', 'doubles']);
  });

  it('keeps games today for the Tonight chip', () => {
    expect(gameIds(withFilters({ times: new Set(['tonight']) }))).toEqual(['tonight']);
  });

  it('keeps morning games for the Mornings chip', () => {
    expect(gameIds(withFilters({ times: new Set(['mornings']) }))).toEqual(['weekend', 'doubles']);
  });

  it('keeps weekend games for the Weekends chip', () => {
    expect(gameIds(withFilters({ times: new Set(['weekends']) }))).toEqual(['weekend']);
  });

  it('leaves out hitting sessions when a format is chosen', () => {
    expect(gameIds(withFilters({ formats: new Set(['singles', 'doubles']) }))).toEqual([
      'tonight',
      'doubles',
    ]);
  });

  it('keeps only the games at a chosen court, not the whole district', () => {
    expect(gameIds(withFilters({ courts: new Set(['Park Jordana']) }))).toEqual(['weekend']);
    expect(gameIds(withFilters({ courts: new Set(['Kazimierz Clay Club']) }))).toEqual([
      'tonight',
      'doubles',
    ]);
  });

  it('keeps games at courts in the chosen district', () => {
    expect(gameIds(withFilters({ districts: new Set(['Krowodrza']) }))).toEqual(['weekend']);
  });

  it('ignores lists that games have no equivalent for', () => {
    expect(gameIds(withFilters({ lists: new Set(['newInKrakow', 'savedPlayers']) }))).toHaveLength(
      3,
    );
  });
});

describe('sortPlayers', () => {
  const sample = [
    player({ id: 'a', fitPercent: 70, distanceKm: 1, rating: 3 }),
    player({ id: 'b', fitPercent: 90, distanceKm: 5, rating: 4.5 }),
    player({ id: 'c', fitPercent: 80, distanceKm: 3, rating: 3.5 }),
  ];

  it('puts the best fit first', () => {
    expect(idsOf(sortPlayers(sample, 'fit'))).toEqual(['b', 'c', 'a']);
  });

  it('puts the closest first', () => {
    expect(idsOf(sortPlayers(sample, 'distance'))).toEqual(['a', 'c', 'b']);
  });

  it('puts the highest level first', () => {
    expect(idsOf(sortPlayers(sample, 'level'))).toEqual(['b', 'c', 'a']);
  });

  it('does not reorder the input', () => {
    sortPlayers(sample, 'distance');

    expect(idsOf(sample)).toEqual(['a', 'b', 'c']);
  });
});

describe('ladderOf and districtsOf', () => {
  it('counts players on every rung', () => {
    const counts = ladderOf(players).map(({ rating, count }) => [rating, count]);

    expect(counts).toEqual([
      [2.5, 1],
      [3, 0],
      [3.5, 1],
      [4, 1],
      [4.5, 0],
      [5, 1],
    ]);
  });

  it('lists each district once in alphabetical order', () => {
    expect(districtsOf(players)).toEqual(['Kazimierz', 'Podgórze']);
  });
});
