// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { createPlayer } from '../testing/players';
import { DomainError } from '../http';
import { updateProfile } from '../profiles';
import { ntrpRatingSchema } from '@/entities/player';
import { listPlayers, listSavedPlayerIds, savePlayer, unsavePlayer } from './players';

const rating = ntrpRatingSchema.parse(3.5);

async function signUp(email: string, district: string) {
  const user = await createPlayer(email);
  updateProfile(user, { name: email.split('@')[0] ?? email, neighborhood: district, rating });
  return user;
}

describe('listPlayers', () => {
  it('lists the other players with their distance and fit, and leaves the viewer out', async () => {
    const viewer = await signUp('viewer@example.com', 'Stare Miasto');
    const other = await signUp('other@example.com', 'Kazimierz');

    const players = listPlayers(viewer);

    expect(players.map((player) => player.id)).toEqual([other.id]);
    expect(players[0]).toMatchObject({ district: 'Kazimierz', fitPercent: expect.any(Number) });
    expect(players[0]?.distanceKm).toBeGreaterThan(0);
  });

  it('marks a recent sign-up as new', async () => {
    const viewer = await signUp('v2@example.com', 'Stare Miasto');
    await signUp('fresh@example.com', 'Podgórze');

    expect(listPlayers(viewer).find((player) => player.name === 'fresh')?.isNew).toBe(true);
  });
});

describe('saved players', () => {
  it('saves a player once and removes them again', async () => {
    const viewer = await signUp('saver@example.com', 'Stare Miasto');
    const other = await signUp('saved@example.com', 'Kazimierz');

    savePlayer(viewer, other.id);
    savePlayer(viewer, other.id);
    expect(listSavedPlayerIds(viewer)).toEqual([other.id]);

    unsavePlayer(viewer, other.id);
    expect(listSavedPlayerIds(viewer)).toEqual([]);
  });

  it('keeps each user list apart', async () => {
    const first = await signUp('first@example.com', 'Stare Miasto');
    const second = await signUp('second@example.com', 'Stare Miasto');
    const other = await signUp('target@example.com', 'Kazimierz');

    savePlayer(first, other.id);

    expect(listSavedPlayerIds(second)).toEqual([]);
  });

  it('refuses to save someone who does not exist or yourself', async () => {
    const viewer = await signUp('lonely@example.com', 'Stare Miasto');

    expect(() => savePlayer(viewer, '00000000-0000-4000-8000-00000000ffff')).toThrow(DomainError);
    expect(() => savePlayer(viewer, viewer.id)).toThrow(DomainError);
  });
});
