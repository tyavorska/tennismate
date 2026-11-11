// @vitest-environment node
import { randomUUID } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import type { User } from '@/entities/user';
import { isoDateSchema } from '@/shared/lib';
import { db } from '../db';
import { deleteGame, joinGame, leaveGame, listCalendarEvents, listOpenGames } from '../games';
import { DomainError } from '../http';
import { addCity } from '../testing/cities';
import { createPlayer, krakowId } from '../testing/players';
import {
  listConversations,
  listMessages,
  listPartnerIds,
  markRead,
  respondToInvite,
  sendMessage,
} from './conversations';

const start = new Date('2026-11-05T10:00:00.000Z');

function at(seconds: number): Date {
  return new Date(start.getTime() + seconds * 1000);
}

function send(from: User, to: User, text: string, seconds: number, clientMessageId = randomUUID()) {
  return sendMessage(from, { recipientId: to.id, clientMessageId, text }, at(seconds));
}

function newEmail(name: string): string {
  return `${name}.${randomUUID().slice(0, 8)}@example.com`;
}

async function pair(): Promise<{ ana: User; ben: User }> {
  return { ana: await createPlayer(newEmail('ana')), ben: await createPlayer(newEmail('ben')) };
}

function kindOf(run: () => void): string | undefined {
  try {
    run();
  } catch (error) {
    return error instanceof DomainError ? error.kind : 'other';
  }
  return undefined;
}

describe('sendMessage', () => {
  it('creates the conversation with the first message, for both players', async () => {
    const { ana, ben } = await pair();

    const sent = send(ana, ben, 'Saturday at 10?', 0);

    expect(sent.forAuthor.conversation.partner.id).toBe(ben.id);
    expect(sent.forOther.conversation.partner.id).toBe(ana.id);
    expect(sent.forAuthor.conversation.id).toBe(sent.forOther.conversation.id);
    expect(listConversations(ben)).toHaveLength(1);
  });

  it('keeps one conversation per pair, whoever writes first', async () => {
    const { ana, ben } = await pair();

    const first = send(ana, ben, 'Hi', 0);
    send(ben, ana, 'Hello', 1);

    expect(listConversations(ana)).toHaveLength(1);
    expect(listMessages(ana, first.forAuthor.conversation.id).map((m) => m.text)).toEqual([
      'Hi',
      'Hello',
    ]);
  });

  it('saves a message once when the same client message id is sent again', async () => {
    const { ana, ben } = await pair();
    const clientMessageId = randomUUID();

    const first = send(ana, ben, 'Hi', 0, clientMessageId);
    const again = send(ana, ben, 'Hi', 5, clientMessageId);

    expect(again.forAuthor.message.id).toBe(first.forAuthor.message.id);
    expect(listMessages(ana, first.forAuthor.conversation.id)).toHaveLength(1);
  });

  it('refuses a message to yourself', async () => {
    const { ana } = await pair();

    expect(kindOf(() => send(ana, ana, 'Hi', 0))).toBe('validation');
  });

  it('answers not found for a player who does not exist', async () => {
    const { ana } = await pair();

    expect(
      kindOf(() =>
        sendMessage(ana, { recipientId: randomUUID(), clientMessageId: randomUUID(), text: 'Hi' }),
      ),
    ).toBe('notFound');
  });

  it('answers not found for a player in another city, and saves nothing', async () => {
    const { ana } = await pair();
    const gdansk = addCity('gdansk-chat');
    const stranger = await createPlayer(newEmail('stranger'), gdansk.id);

    expect(kindOf(() => send(ana, stranger, 'Hi', 0))).toBe('notFound');

    expect(listConversations(ana)).toHaveLength(0);
    expect(listConversations(stranger)).toHaveLength(0);
  });
});

describe('invites', () => {
  async function trio(): Promise<{ ana: User; ben: User; cleo: User }> {
    return { ...(await pair()), cleo: await createPlayer(newEmail('cleo')) };
  }

  function courtName(): string {
    const row = db
      .prepare('SELECT name FROM courts WHERE city_id = ? AND removed_at IS NULL LIMIT 1')
      .get(krakowId());
    return z.object({ name: z.string() }).parse(row).name;
  }

  const gameDay = '2026-11-12';

  function invite(from: User, to: User, seconds = 1) {
    return sendMessage(
      from,
      {
        recipientId: to.id,
        clientMessageId: randomUUID(),
        text: 'Play?',
        invite: { court: courtName(), date: gameDay, time: '10:00' },
      },
      at(seconds),
    );
  }

  function respond(
    user: User,
    inviteId: string,
    action: 'accept' | 'decline' | 'cancel',
    seconds = 5,
  ) {
    return respondToInvite(user, { inviteId, action }, at(seconds));
  }

  function inviteIdOf(sent: ReturnType<typeof invite>): string {
    return sent.forAuthor.message.invite?.id ?? '';
  }

  function calendarOf(user: User) {
    return listCalendarEvents(
      user,
      isoDateSchema.parse('2026-11-09'),
      isoDateSchema.parse('2026-11-15'),
    );
  }

  it('shows a pending invite to both players, and creates no game yet', async () => {
    const { ana, ben } = await trio();

    const sent = invite(ana, ben);

    expect(sent.forOther.message.invite).toMatchObject({
      status: 'pending',
      proposerId: ana.id,
      date: gameDay,
      time: '10:00',
    });
    expect(calendarOf(ana)).toEqual([]);
    expect(calendarOf(ben)).toEqual([]);
  });

  it('puts an accepted game in both calendars, with the other player as the title', async () => {
    const { ana, ben } = await trio();
    const sent = invite(ana, ben);

    respond(ben, inviteIdOf(sent), 'accept');

    expect(calendarOf(ana)).toEqual([
      expect.objectContaining({
        kind: 'game',
        title: expect.stringContaining('Ben'),
        confirmed: true,
        date: gameDay,
        time: '10:00',
      }),
    ]);
    expect(calendarOf(ben)).toEqual([
      expect.objectContaining({
        kind: 'game',
        title: expect.stringContaining('Ana'),
        confirmed: true,
      }),
    ]);
  });

  it('writes a reply when the invite is accepted, and makes the game the plan', async () => {
    const { ana, ben } = await trio();
    const sent = invite(ana, ben);

    const answer = respond(ben, inviteIdOf(sent), 'accept');

    expect(answer.updated.forAuthor.message.invite?.status).toBe('accepted');
    expect(answer.reply?.forOther.message.text).toContain('Accepted');
    expect(answer.reply?.forOther.conversation.unreadCount).toBeGreaterThan(0);
    expect(listConversations(ana, at(6))[0]?.plan).toMatchObject({ date: gameDay, time: '10:00' });
    expect(listConversations(ben, at(6))[0]?.plan).toMatchObject({ date: gameDay, time: '10:00' });
  });

  it('never shows an invite game to a third player, as an open game or in their calendar', async () => {
    const { ana, ben, cleo } = await trio();
    respond(ben, inviteIdOf(invite(ana, ben)), 'accept');

    expect(calendarOf(cleo)).toEqual([]);
    expect(listOpenGames(cleo, at(6)).filter((game) => game.hostName === 'Ana')).toEqual([]);
  });

  it('keeps an invite game out of the open games API', async () => {
    const { ana, ben, cleo } = await trio();
    respond(ben, inviteIdOf(invite(ana, ben)), 'accept');
    const { id } = z
      .object({ id: z.string() })
      .parse(db.prepare('SELECT id FROM games WHERE host_id = ?').get(ana.id));

    expect(kindOf(() => joinGame(cleo, id, at(6)))).toBe('notFound');
    expect(kindOf(() => leaveGame(ben, id, at(6)))).toBe('notFound');
    expect(kindOf(() => deleteGame(ana, id))).toBe('notFound');
  });

  it('repeats an accept without a second game or a second reply', async () => {
    const { ana, ben } = await trio();
    const sent = invite(ana, ben);

    respond(ben, inviteIdOf(sent), 'accept');
    const again = respond(ben, inviteIdOf(sent), 'accept', 6);

    expect(again.reply).toBeUndefined();
    expect(calendarOf(ana)).toHaveLength(1);
    expect(listMessages(ben, sent.forAuthor.conversation.id)).toHaveLength(2);
  });

  it('declines and cancels without a game', async () => {
    const { ana, ben } = await trio();
    const declined = invite(ana, ben);
    const cancelled = invite(ana, ben, 2);

    const answer = respond(ben, inviteIdOf(declined), 'decline');
    respond(ana, inviteIdOf(cancelled), 'cancel');

    expect(answer.updated.forOther.message.invite?.status).toBe('declined');
    expect(calendarOf(ana)).toEqual([]);
    expect(calendarOf(ben)).toEqual([]);
  });

  it('refuses a change of mind after the invite was answered', async () => {
    const { ana, ben } = await trio();
    const accepted = invite(ana, ben);
    const declined = invite(ana, ben, 2);
    respond(ben, inviteIdOf(accepted), 'accept');
    respond(ben, inviteIdOf(declined), 'decline');

    expect(kindOf(() => respond(ben, inviteIdOf(accepted), 'decline', 7))).toBe('conflict');
    expect(kindOf(() => respond(ben, inviteIdOf(declined), 'accept', 7))).toBe('conflict');
    expect(kindOf(() => respond(ana, inviteIdOf(accepted), 'cancel', 7))).toBe('conflict');
  });

  it('refuses to accept after the time has passed, and shows the invite as expired', async () => {
    const { ana, ben } = await trio();
    const sent = invite(ana, ben);
    const afterwards = new Date('2026-11-12T12:00:00.000Z');

    expect(
      kindOf(() =>
        respondToInvite(ben, { inviteId: inviteIdOf(sent), action: 'accept' }, afterwards),
      ),
    ).toBe('conflict');
    expect(
      listMessages(ben, sent.forAuthor.conversation.id, {}, afterwards).at(-1)?.invite?.status,
    ).toBe('expired');
  });

  it('lets only the invited player answer and only the proposer cancel', async () => {
    const { ana, ben } = await trio();
    const sent = invite(ana, ben);

    expect(kindOf(() => respond(ana, inviteIdOf(sent), 'accept'))).toBe('forbidden');
    expect(kindOf(() => respond(ben, inviteIdOf(sent), 'cancel'))).toBe('forbidden');
  });

  it('answers not found to a stranger and to a player in another city', async () => {
    const { ana, ben, cleo } = await trio();
    const sent = invite(ana, ben);
    const gdansk = addCity('gdansk-invite');
    const outsider = await createPlayer(newEmail('outsider'), gdansk.id);

    expect(kindOf(() => respond(cleo, inviteIdOf(sent), 'accept'))).toBe('notFound');
    expect(kindOf(() => respond(outsider, inviteIdOf(sent), 'accept'))).toBe('notFound');
    expect(kindOf(() => respond(ben, randomUUID(), 'accept'))).toBe('notFound');
  });

  it('refuses an invite for a court of another city, or a time in the past', async () => {
    const { ana, ben } = await trio();
    const gdansk = addCity('gdansk-court');
    const request = (court: string, date: string) => () =>
      sendMessage(
        ana,
        {
          recipientId: ben.id,
          clientMessageId: randomUUID(),
          text: 'Play?',
          invite: { court, date, time: '10:00' },
        },
        at(1),
      );

    expect(kindOf(request(gdansk.court, gameDay))).toBe('validation');
    expect(kindOf(request(courtName(), '2026-11-04'))).toBe('validation');
    expect(kindOf(request(courtName(), '2027-06-01'))).toBe('validation');
    expect(listConversations(ben)).toHaveLength(0);
  });

  it('saves an invite once when the same client message id is sent again', async () => {
    const { ana, ben } = await trio();
    const clientMessageId = randomUUID();
    const send = () =>
      sendMessage(
        ana,
        {
          recipientId: ben.id,
          clientMessageId,
          text: 'Play?',
          invite: { court: courtName(), date: gameDay, time: '10:00' },
        },
        at(1),
      );

    const first = send();
    const again = send();

    expect(again.forAuthor.message.invite?.id).toBe(first.forAuthor.message.invite?.id);
  });
});

describe('listConversations', () => {
  it('shows the most recent conversation first, with the last message', async () => {
    const { ana, ben } = await pair();
    const cleo = await createPlayer(newEmail('cleo'));
    send(ana, ben, 'First', 0);
    send(ana, cleo, 'Second', 10);

    expect(listConversations(ana).map((c) => c.lastMessage.text)).toEqual(['Second', 'First']);
  });

  it('never includes an email', async () => {
    const { ana, ben } = await pair();
    send(ana, ben, 'Hi', 0);

    expect(JSON.stringify(listConversations(ana))).not.toContain('@example.com');
  });

  it('hides a conversation with someone who moved to another city', async () => {
    const { ana, ben } = await pair();
    send(ana, ben, 'Hi', 0);
    const city = addCity('moved-chat');

    db.prepare(
      'UPDATE profiles SET city_id = ?, district_id = (SELECT id FROM districts WHERE city_id = ?) WHERE user_id = ?',
    ).run(city.id, city.id, ben.id);

    expect(listConversations(ana)).toHaveLength(0);
  });
});

describe('unread and markRead', () => {
  it('counts the messages from the other player that the viewer has not read', async () => {
    const { ana, ben } = await pair();
    send(ana, ben, 'One', 0);
    send(ana, ben, 'Two', 1);

    expect(listConversations(ben)[0]?.unreadCount).toBe(2);
    expect(listConversations(ana)[0]?.unreadCount).toBe(0);
  });

  it('clears the count once read, and counts a message that arrives later', async () => {
    const { ana, ben } = await pair();
    const { forAuthor } = send(ana, ben, 'One', 0);

    markRead(ben, forAuthor.conversation.id);
    markRead(ben, forAuthor.conversation.id);
    expect(listConversations(ben)[0]?.unreadCount).toBe(0);

    send(ana, ben, 'Two', 1);
    expect(listConversations(ben)[0]?.unreadCount).toBe(1);
  });

  it('counts messages sent in the same millisecond as the one that was read', async () => {
    const { ana, ben } = await pair();
    const { forAuthor } = send(ana, ben, 'One', 0);
    markRead(ben, forAuthor.conversation.id);

    send(ana, ben, 'Two', 0);
    send(ana, ben, 'Three', 0);

    expect(listConversations(ben)[0]?.unreadCount).toBe(2);
  });

  it('refuses a stranger', async () => {
    const { ana, ben } = await pair();
    const { forAuthor } = send(ana, ben, 'Hi', 0);
    const stranger = await createPlayer(newEmail('eve'));

    expect(kindOf(() => markRead(stranger, forAuthor.conversation.id))).toBe('notFound');
    expect(kindOf(() => listMessages(stranger, forAuthor.conversation.id))).toBe('notFound');
  });
});

describe('listMessages', () => {
  it('returns the messages after a cursor, oldest first', async () => {
    const { ana, ben } = await pair();
    const first = send(ana, ben, 'One', 0);
    send(ben, ana, 'Two', 1);
    send(ana, ben, 'Three', 2);

    const missed = listMessages(ben, first.forAuthor.conversation.id, {
      after: first.forAuthor.message.id,
    });

    expect(missed.map((m) => m.text)).toEqual(['Two', 'Three']);
  });

  it('keeps the order of messages sent in the same millisecond', async () => {
    const { ana, ben } = await pair();
    const first = send(ana, ben, 'One', 0);
    for (const text of ['Two', 'Three', 'Four', 'Five']) send(ana, ben, text, 0);

    const all = listMessages(ben, first.forAuthor.conversation.id);
    const after = listMessages(ben, first.forAuthor.conversation.id, {
      after: first.forAuthor.message.id,
    });

    expect(all.map((m) => m.text)).toEqual(['One', 'Two', 'Three', 'Four', 'Five']);
    expect(after.map((m) => m.text)).toEqual(['Two', 'Three', 'Four', 'Five']);
  });

  it('answers not found for a cursor from another conversation', async () => {
    const { ana, ben } = await pair();
    const cleo = await createPlayer(newEmail('cleo'));
    const mine = send(ana, ben, 'One', 0);
    const other = send(ana, cleo, 'Elsewhere', 1);

    expect(
      kindOf(() =>
        listMessages(ana, mine.forAuthor.conversation.id, { after: other.forAuthor.message.id }),
      ),
    ).toBe('notFound');
  });
});

describe('listPartnerIds', () => {
  it('lists the people the player has a conversation with', async () => {
    const { ana, ben } = await pair();
    send(ana, ben, 'Hi', 0);

    expect(listPartnerIds(ana.id)).toEqual([ben.id]);
    expect(listPartnerIds(ben.id)).toEqual([ana.id]);
  });
});
