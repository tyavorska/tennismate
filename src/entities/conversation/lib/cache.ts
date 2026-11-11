import type { QueryClient } from '@tanstack/react-query';
import { conversationQueries, presenceQueries } from '../api/conversationQueries';
import type { Conversation, Message } from '../model/conversation';
import type { MessageNewEvent, PresenceSnapshot, PresenceUpdate } from '../model/events';

function byLatest(a: Conversation, b: Conversation): number {
  return b.lastMessage.sentAt.localeCompare(a.lastMessage.sentAt);
}

/** Adds messages that are not there yet. A message that arrives twice is kept once. */
export function mergeMessages(
  current: readonly Message[],
  incoming: readonly Message[],
): readonly Message[] {
  const known = new Set(current.map((message) => message.id));
  const added = incoming.filter((message) => !known.has(message.id));
  return added.length === 0
    ? current
    : [...current, ...added].toSorted((a, b) => a.sentAt.localeCompare(b.sentAt));
}

/** Puts a new message in the list and, when the thread is loaded, in the thread. */
export function applyMessageNew(queryClient: QueryClient, event: MessageNewEvent): void {
  queryClient.setQueryData(conversationQueries.list().queryKey, (current) =>
    [...(current ?? []).filter(({ id }) => id !== event.conversation.id), event.conversation].sort(
      byLatest,
    ),
  );
  queryClient.setQueryData(
    conversationQueries.messages(event.conversation.id).queryKey,
    (current) => current && mergeMessages(current, [event.message]),
  );
}

export function applyPresenceSnapshot(queryClient: QueryClient, snapshot: PresenceSnapshot): void {
  queryClient.setQueryData(presenceQueries.online().queryKey, snapshot.onlineIds);
}

export function applyPresenceUpdate(queryClient: QueryClient, update: PresenceUpdate): void {
  queryClient.setQueryData(presenceQueries.online().queryKey, (current = []) => {
    const others = current.filter((id) => id !== update.userId);
    return update.online ? [...others, update.userId] : others;
  });
}

export function markConversationRead(queryClient: QueryClient, conversationId: string): void {
  queryClient.setQueryData(conversationQueries.list().queryKey, (current) =>
    current?.map((conversation) =>
      conversation.id === conversationId ? { ...conversation, unreadCount: 0 } : conversation,
    ),
  );
}
