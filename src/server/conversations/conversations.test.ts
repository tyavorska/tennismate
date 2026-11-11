// @vitest-environment node
import { randomUUID } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import type { User } from '@/entities/user';
import { db } from '../db';
import { DomainError } from '../http';
import { addCity } from '../testing/cities';
import { createPlayer } from '../testing/players';
import {
  listConversations,
  listMessages,
  listPartnerIds,
  markRead,
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

    expect(sent.forSender.conversation.partner.id).toBe(ben.id);
    expect(sent.forRecipient.conversation.partner.id).toBe(ana.id);
    expect(sent.forSender.conversation.id).toBe(sent.forRecipient.conversation.id);
    expect(listConversations(ben)).toHaveLength(1);
  });

  it('keeps one conversation per pair, whoever writes first', async () => {
    const { ana, ben } = await pair();

    const first = send(ana, ben, 'Hi', 0);
    send(ben, ana, 'Hello', 1);

    expect(listConversations(ana)).toHaveLength(1);
    expect(listMessages(ana, first.forSender.conversation.id).map((m) => m.text)).toEqual([
      'Hi',
      'Hello',
    ]);
  });

  it('saves a message once when the same client message id is sent again', async () => {
    const { ana, ben } = await pair();
    const clientMessageId = randomUUID();

    const first = send(ana, ben, 'Hi', 0, clientMessageId);
    const again = send(ana, ben, 'Hi', 5, clientMessageId);

    expect(again.forSender.message.id).toBe(first.forSender.message.id);
    expect(listMessages(ana, first.forSender.conversation.id)).toHaveLength(1);
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
  it('makes the latest invite the plan of the conversation, for both players', async () => {
    const { ana, ben } = await pair();
    send(ana, ben, 'Hi', 0);
    const first = { court: 'Kazimierz Clay Club', slot: 'Tomorrow 10:00' };
    const second = { court: 'Park Jordana', slot: 'Thu 5 Nov 19:30' };

    sendMessage(
      ana,
      { recipientId: ben.id, clientMessageId: randomUUID(), text: 'Play?', invite: first },
      at(1),
    );
    const sent = sendMessage(
      ben,
      {
        recipientId: ana.id,
        clientMessageId: randomUUID(),
        text: 'How about this?',
        invite: second,
      },
      at(2),
    );
    send(ana, ben, 'Great', 3);

    expect(sent.forSender.message.invite).toEqual(second);
    expect(listConversations(ana)[0]?.plan).toEqual(second);
    expect(listConversations(ben)[0]?.plan).toEqual(second);
  });

  it('has no plan until someone sends an invite', async () => {
    const { ana, ben } = await pair();
    send(ana, ben, 'Hi', 0);

    expect(listConversations(ben)[0]?.plan).toBeUndefined();
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
    const { forSender } = send(ana, ben, 'One', 0);

    markRead(ben, forSender.conversation.id);
    markRead(ben, forSender.conversation.id);
    expect(listConversations(ben)[0]?.unreadCount).toBe(0);

    send(ana, ben, 'Two', 1);
    expect(listConversations(ben)[0]?.unreadCount).toBe(1);
  });

  it('counts messages sent in the same millisecond as the one that was read', async () => {
    const { ana, ben } = await pair();
    const { forSender } = send(ana, ben, 'One', 0);
    markRead(ben, forSender.conversation.id);

    send(ana, ben, 'Two', 0);
    send(ana, ben, 'Three', 0);

    expect(listConversations(ben)[0]?.unreadCount).toBe(2);
  });

  it('refuses a stranger', async () => {
    const { ana, ben } = await pair();
    const { forSender } = send(ana, ben, 'Hi', 0);
    const stranger = await createPlayer(newEmail('eve'));

    expect(kindOf(() => markRead(stranger, forSender.conversation.id))).toBe('notFound');
    expect(kindOf(() => listMessages(stranger, forSender.conversation.id))).toBe('notFound');
  });
});

describe('listMessages', () => {
  it('returns the messages after a cursor, oldest first', async () => {
    const { ana, ben } = await pair();
    const first = send(ana, ben, 'One', 0);
    send(ben, ana, 'Two', 1);
    send(ana, ben, 'Three', 2);

    const missed = listMessages(ben, first.forSender.conversation.id, {
      after: first.forSender.message.id,
    });

    expect(missed.map((m) => m.text)).toEqual(['Two', 'Three']);
  });

  it('keeps the order of messages sent in the same millisecond', async () => {
    const { ana, ben } = await pair();
    const first = send(ana, ben, 'One', 0);
    for (const text of ['Two', 'Three', 'Four', 'Five']) send(ana, ben, text, 0);

    const all = listMessages(ben, first.forSender.conversation.id);
    const after = listMessages(ben, first.forSender.conversation.id, {
      after: first.forSender.message.id,
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
        listMessages(ana, mine.forSender.conversation.id, { after: other.forSender.message.id }),
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
