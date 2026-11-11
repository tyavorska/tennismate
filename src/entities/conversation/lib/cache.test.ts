import { QueryClient } from '@tanstack/react-query';
import { describe, expect, it } from 'vitest';
import { conversationQueries, presenceQueries } from '../api/conversationQueries';
import {
  conversationSchema,
  messageSchema,
  type Conversation,
  type Message,
} from '../model/conversation';
import {
  applyMessageNew,
  applyPresenceSnapshot,
  applyPresenceUpdate,
  markConversationRead,
  mergeMessages,
} from './cache';

function uuid(n: number): string {
  return `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
}

function message(n: number, conversationN: number, sentAt: string): Message {
  return messageSchema.parse({
    id: uuid(n),
    conversationId: uuid(conversationN),
    senderId: uuid(900),
    clientMessageId: uuid(n + 5000),
    text: `Message ${n}`,
    sentAt,
  });
}

function conversation(n: number, last: Message, unreadCount = 1): Conversation {
  return conversationSchema.parse({
    id: uuid(n),
    partner: {
      id: uuid(n + 100),
      name: `Player ${n}`,
      initials: `P${n}`,
      subtitle: 'NTRP 3.0 · X',
    },
    lastMessage: last,
    unreadCount,
  });
}

function client(): QueryClient {
  return new QueryClient();
}

describe('applyMessageNew', () => {
  it('adds a new conversation and puts the most recent one first', () => {
    const queryClient = client();
    const older = conversation(1, message(11, 1, '2026-11-04T09:00:00.000Z'));
    queryClient.setQueryData(conversationQueries.list().queryKey, [older]);
    const arrived = message(22, 2, '2026-11-04T10:00:00.000Z');

    applyMessageNew(queryClient, { conversation: conversation(2, arrived), message: arrived });

    const list = queryClient.getQueryData(conversationQueries.list().queryKey);
    expect(list?.map(({ id }) => id)).toEqual([uuid(2), uuid(1)]);
  });

  it('replaces the entry of a conversation that is already listed', () => {
    const queryClient = client();
    const first = message(11, 1, '2026-11-04T09:00:00.000Z');
    queryClient.setQueryData(conversationQueries.list().queryKey, [conversation(1, first, 0)]);
    const arrived = message(12, 1, '2026-11-04T09:05:00.000Z');

    applyMessageNew(queryClient, { conversation: conversation(1, arrived, 1), message: arrived });

    const list = queryClient.getQueryData(conversationQueries.list().queryKey);
    expect(list).toHaveLength(1);
    expect(list?.[0]?.unreadCount).toBe(1);
  });

  it('adds the message to a loaded thread once, however often it arrives', () => {
    const queryClient = client();
    const first = message(11, 1, '2026-11-04T09:00:00.000Z');
    queryClient.setQueryData(conversationQueries.messages(uuid(1)).queryKey, [first]);
    const arrived = message(12, 1, '2026-11-04T09:05:00.000Z');
    const event = { conversation: conversation(1, arrived), message: arrived };

    applyMessageNew(queryClient, event);
    applyMessageNew(queryClient, event);

    const thread = queryClient.getQueryData(conversationQueries.messages(uuid(1)).queryKey);
    expect(thread?.map(({ text }) => text)).toEqual(['Message 11', 'Message 12']);
  });

  it('leaves a thread alone that was never loaded, so opening it fetches everything', () => {
    const queryClient = client();
    const arrived = message(12, 1, '2026-11-04T09:05:00.000Z');

    applyMessageNew(queryClient, { conversation: conversation(1, arrived), message: arrived });

    expect(
      queryClient.getQueryData(conversationQueries.messages(uuid(1)).queryKey),
    ).toBeUndefined();
  });
});

describe('mergeMessages', () => {
  it('keeps messages that share a time in the order they came', () => {
    const a = message(2, 1, '2026-11-04T09:00:00.000Z');
    const b = message(1, 1, '2026-11-04T09:00:00.000Z');

    expect(mergeMessages([a], [b]).map(({ id }) => id)).toEqual([uuid(2), uuid(1)]);
  });
});

describe('markConversationRead', () => {
  it('clears only that conversation', () => {
    const queryClient = client();
    const at = '2026-11-04T09:00:00.000Z';
    queryClient.setQueryData(conversationQueries.list().queryKey, [
      conversation(1, message(11, 1, at), 2),
      conversation(2, message(22, 2, at), 3),
    ]);

    markConversationRead(queryClient, uuid(1));

    const list = queryClient.getQueryData(conversationQueries.list().queryKey);
    expect(list?.map(({ unreadCount }) => unreadCount)).toEqual([0, 3]);
  });
});

describe('presence', () => {
  it('replaces everyone with a snapshot, then follows updates', () => {
    const queryClient = client();

    applyPresenceSnapshot(queryClient, { onlineIds: [uuid(1), uuid(2)] });
    applyPresenceUpdate(queryClient, { userId: uuid(3), online: true });
    applyPresenceUpdate(queryClient, { userId: uuid(1), online: false });
    applyPresenceUpdate(queryClient, { userId: uuid(3), online: true });

    expect(queryClient.getQueryData(presenceQueries.online().queryKey)).toEqual([uuid(2), uuid(3)]);
  });
});
