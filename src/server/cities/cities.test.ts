// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { newGameSchema, ntrpRatingSchema, type NewGame } from '@/entities/player';
import { isoDateSchema } from '@/shared/lib';
import { db } from '../db';
import { listCourts, listDistricts } from '../courts';
import { createGame, deleteGame, joinGame, listCalendarEvents, listOpenGames } from '../games';
import { DomainError } from '../http';
import { listPlayers, listSavedPlayerIds, savePlayer } from '../players';
import { getProfile, updateProfile } from '../profiles';
import { addCity, addTournament } from '../testing/cities';
import { createPlayer, krakowId } from '../testing/players';
import { listCities } from './cities';

// Monday 2 Nov 2026, noon in Kraków.
const now = new Date('2026-11-02T11:00:00.000Z');
const from = isoDateSchema.parse('2026-11-02');
const to = isoDateSchema.parse('2026-12-06');
const gdansk = addCity('gdansk');

function offer(court: string): NewGame {
  return newGameSchema.parse({
    day: 'Tomorrow',
    time: '18:30',
    format: 'singles',
    rating: ntrpRatingSchema.parse(3.5),
    court,
    lookingFor: 'nearLevel',
    note: '',
  });
}

function playerIn(email: string, cityId?: number) {
  return createPlayer(email, cityId);
}

function kindOfError(work: () => void): string | undefined {
  try {
    work();
  } catch (error) {
    return error instanceof DomainError ? error.kind : 'other';
  }
  return undefined;
}

describe('cities', () => {
  it('lists the cities the app is open in', () => {
    expect(listCities().map((city) => city.slug)).toEqual(['gdansk', 'krakow']);
  });

  it('starts an account in the district closest to the middle of its city', async () => {
    const user = await playerIn('start@example.com');

    expect(getProfile(user)).toMatchObject({
      city: { id: krakowId(), name: 'Kraków' },
      neighborhood: 'Stare Miasto',
    });
  });

  it('starts an account in the city it asks for', async () => {
    const user = await playerIn('gd@example.com', gdansk.id);

    expect(getProfile(user)).toMatchObject({
      city: { id: gdansk.id, name: 'gdansk' },
      neighborhood: gdansk.district,
    });
  });
});

describe('courts and districts', () => {
  it('only list the ones in the asked city', () => {
    expect(listCourts(gdansk.id).map((court) => court.name)).toEqual([gdansk.court]);
    expect(listDistricts(gdansk.id)).toEqual([gdansk.district]);
    expect(listCourts(krakowId()).map((court) => court.name)).not.toContain(gdansk.court);
  });
});

describe('profiles', () => {
  it('refuse a district from another city', async () => {
    const user = await playerIn('district@example.com');

    expect(
      kindOfError(() =>
        updateProfile(user, {
          name: 'Ana',
          neighborhood: gdansk.district,
          rating: ntrpRatingSchema.parse(3),
        }),
      ),
    ).toBe('validation');
  });
});

describe('players', () => {
  it('only come from the viewer city', async () => {
    const viewer = await playerIn('viewer@example.com');
    const neighbour = await playerIn('neighbour@example.com');
    const faraway = await playerIn('faraway@example.com', gdansk.id);

    const ids = listPlayers(viewer).map((player) => player.id);

    expect(ids).toContain(neighbour.id);
    expect(ids).not.toContain(faraway.id);
  });

  it('cannot be saved from another city, and look like they do not exist', async () => {
    const viewer = await playerIn('saver@example.com');
    const faraway = await playerIn('saved-faraway@example.com', gdansk.id);

    expect(kindOfError(() => savePlayer(viewer, faraway.id))).toBe('notFound');
  });

  it('stay saved but are hidden when they are in another city', async () => {
    const viewer = await playerIn('keeper@example.com');
    const friend = await playerIn('friend@example.com');
    savePlayer(viewer, friend.id);
    expect(listSavedPlayerIds(viewer)).toEqual([friend.id]);

    db.prepare(
      `UPDATE profiles SET city_id = ?, district_id = (SELECT id FROM districts WHERE name = ?)
       WHERE user_id = ?`,
    ).run(gdansk.id, gdansk.district, friend.id);

    expect(listSavedPlayerIds(viewer)).toEqual([]);
  });
});

describe('games', () => {
  it('only come from the viewer city', async () => {
    const mine = await playerIn('host-pl@example.com');
    const theirs = await playerIn('host-gd@example.com', gdansk.id);
    const viewer = await playerIn('viewer-games@example.com');
    createGame(mine, offer('Park Jordana'), now);
    createGame(theirs, offer(gdansk.court), now);

    const courts = listOpenGames(viewer, now).map((game) => game.court);

    expect(courts).toContain('Park Jordana');
    expect(courts).not.toContain(gdansk.court);
  });

  it('cannot be created on a court in another city', async () => {
    const host = await playerIn('court-host@example.com');

    expect(kindOfError(() => createGame(host, offer(gdansk.court), now))).toBe('validation');
  });

  it('cannot be joined or removed from another city, and look like they do not exist', async () => {
    const theirs = await playerIn('owner-gd@example.com', gdansk.id);
    const visitor = await playerIn('visitor@example.com');
    const game = createGame(theirs, offer(gdansk.court), now);

    expect(kindOfError(() => joinGame(visitor, game.id, now))).toBe('notFound');
    expect(kindOfError(() => deleteGame(visitor, game.id))).toBe('notFound');
  });
});

describe('calendar', () => {
  it('leaves out games and tournaments of other cities', async () => {
    const mine = await playerIn('cal-pl@example.com');
    const theirs = await playerIn('cal-gd@example.com', gdansk.id);
    const viewer = await playerIn('cal-viewer@example.com');
    const local = createGame(mine, offer('Park Jordana'), now);
    const remote = createGame(theirs, offer(gdansk.court), now);
    addTournament(gdansk.court, '2026-11-20');

    const events = listCalendarEvents(viewer, from, to);

    expect(events.map((event) => event.id)).toContain(local.id);
    expect(events.map((event) => event.id)).not.toContain(remote.id);
    expect(
      events.some((event) => event.kind === 'tournament' && event.venue === gdansk.court),
    ).toBe(false);
    expect(listCalendarEvents(theirs, from, to).some((event) => event.id === remote.id)).toBe(true);
  });
});
