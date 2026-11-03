// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { ntrpRatingSchema, newGameSchema, type NewGame } from '@/entities/player';
import { createPlayer } from '../testing/players';
import { DomainError } from '../http';
import {
  createGame,
  deleteGame,
  joinGame,
  leaveGame,
  listCalendarEvents,
  listOpenGames,
} from './games';
import { isoDateSchema } from '@/shared/lib';

// Monday 2 Nov 2026, noon in Kraków.
const now = new Date('2026-11-02T11:00:00.000Z');

function offer(overrides: Partial<NewGame> = {}): NewGame {
  return newGameSchema.parse({
    day: 'Tomorrow',
    time: '18:30',
    format: 'singles',
    rating: ntrpRatingSchema.parse(3.5),
    court: 'Park Jordana',
    lookingFor: 'nearLevel',
    note: '',
    ...overrides,
  });
}

async function signUp(email: string) {
  return createPlayer(email);
}

function expectDomainError(work: () => void, kind: string): void {
  try {
    work();
  } catch (error) {
    expect(error).toBeInstanceOf(DomainError);
    expect(error instanceof DomainError && error.kind).toBe(kind);
    return;
  }
  throw new Error('Expected a DomainError');
}

describe('createGame', () => {
  it("stores the game on the date the day means and returns it as the host's own", async () => {
    const host = await signUp('host1@example.com');

    const game = createGame(host, offer({ day: 'Sat', time: '09:00' }), now);

    expect(game).toMatchObject({
      hostName: 'You',
      isMine: true,
      isJoined: false,
      day: 'Sat',
      time: '09:00',
      court: 'Park Jordana',
      district: 'Krowodrza',
      spotsOpen: 1,
    });
  });

  it('gives a doubles game three open spots', async () => {
    const host = await signUp('host2@example.com');

    expect(createGame(host, offer({ format: 'doubles' }), now).spotsOpen).toBe(3);
  });

  it('rejects a time that has already passed today', async () => {
    const host = await signUp('host3@example.com');

    expectDomainError(
      () => createGame(host, offer({ day: 'Today', time: '07:00' }), now),
      'validation',
    );
  });

  it('rejects a court that does not exist', async () => {
    const host = await signUp('host4@example.com');

    expectDomainError(
      () => createGame(host, offer({ court: 'Nowhere Courts' }), now),
      'validation',
    );
  });
});

describe('listOpenGames', () => {
  it("shows other players' games with the host name and leaves out games already played", async () => {
    const host = await signUp('host5@example.com');
    const viewer = await signUp('viewer5@example.com');
    createGame(host, offer({ time: '19:00' }), now);

    const games = listOpenGames(viewer, now);

    const seen = games.find((game) => game.time === '19:00');
    expect(seen).toMatchObject({ isMine: false, isJoined: false, hostName: 'Host5' });
    expect(
      listOpenGames(viewer, new Date('2026-11-04T00:00:00.000Z')).find(
        (game) => game.id === seen?.id,
      ),
    ).toBe(undefined);
  });
});

describe('joinGame', () => {
  it('takes a spot, and joining again changes nothing', async () => {
    const host = await signUp('host6@example.com');
    const player = await signUp('player6@example.com');
    const { id } = createGame(host, offer({ format: 'doubles' }), now);

    expect(joinGame(player, id, now)).toMatchObject({ isJoined: true, spotsOpen: 2 });
    expect(joinGame(player, id, now)).toMatchObject({ isJoined: true, spotsOpen: 2 });
  });

  it('gives the last spot to one player and tells the next the game is full', async () => {
    const host = await signUp('host7@example.com');
    const first = await signUp('first7@example.com');
    const second = await signUp('second7@example.com');
    const { id } = createGame(host, offer(), now);

    joinGame(first, id, now);

    expectDomainError(() => joinGame(second, id, now), 'conflict');
  });

  it('does not let the host join their own game', async () => {
    const host = await signUp('host8@example.com');
    const { id } = createGame(host, offer(), now);

    expectDomainError(() => joinGame(host, id, now), 'conflict');
  });

  it('frees the spot when the player leaves', async () => {
    const host = await signUp('host9@example.com');
    const player = await signUp('player9@example.com');
    const { id } = createGame(host, offer(), now);
    joinGame(player, id, now);

    expect(leaveGame(player, id, now)).toMatchObject({ isJoined: false, spotsOpen: 1 });
  });

  it('answers not found for a game that does not exist', async () => {
    const player = await signUp('player10@example.com');

    expectDomainError(
      () => joinGame(player, '00000000-0000-4000-8000-00000000ffff', now),
      'notFound',
    );
  });
});

describe('deleteGame', () => {
  it('lets the host remove the game', async () => {
    const host = await signUp('host11@example.com');
    const { id } = createGame(host, offer(), now);

    deleteGame(host, id);

    expectDomainError(() => deleteGame(host, id), 'notFound');
  });

  it('refuses anyone else', async () => {
    const host = await signUp('host12@example.com');
    const other = await signUp('other12@example.com');
    const { id } = createGame(host, offer(), now);

    expectDomainError(() => deleteGame(other, id), 'forbidden');
  });
});

describe('listCalendarEvents', () => {
  const from = isoDateSchema.parse('2026-11-02');
  const to = isoDateSchema.parse('2026-11-30');

  it('shows your hosted game as waiting, a joined game as confirmed and a free game as open', async () => {
    const me = await signUp('me13@example.com');
    const host = await signUp('host13@example.com');
    createGame(me, offer({ time: '17:30' }), now);
    const joined = createGame(host, offer({ time: '19:00' }), now);
    joinGame(me, joined.id, now);
    createGame(host, offer({ day: 'Sat', time: '09:00' }), now);

    const events = listCalendarEvents(me, from, to);

    expect(events).toContainEqual(
      expect.objectContaining({ kind: 'game', time: '17:30', confirmed: false }),
    );
    expect(events).toContainEqual(
      expect.objectContaining({ kind: 'game', time: '19:00', title: 'Host13', confirmed: true }),
    );
    expect(events).toContainEqual(
      expect.objectContaining({ kind: 'open', time: '09:00', host: 'Host13' }),
    );
  });

  it('hides a game that is already full for everyone else', async () => {
    const host = await signUp('host14@example.com');
    const player = await signUp('player14@example.com');
    const viewer = await signUp('viewer14@example.com');
    const { id } = createGame(host, offer({ time: '20:00' }), now);
    joinGame(player, id, now);

    expect(listCalendarEvents(viewer, from, to).some((event) => event.id === id)).toBe(false);
  });

  it('rejects a range longer than two months', async () => {
    const viewer = await signUp('viewer15@example.com');

    expectDomainError(
      () => listCalendarEvents(viewer, from, isoDateSchema.parse('2027-03-01')),
      'validation',
    );
  });
});
