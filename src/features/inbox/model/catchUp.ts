import type { QueryClient } from '@tanstack/react-query';
import { calendarQueries } from '@/entities/game';
import {
  conversationApi,
  conversationQueries,
  mergeMessages,
  type Message,
} from '@/entities/conversation';

async function catchUpThread(queryClient: QueryClient, thread: readonly Message[]): Promise<void> {
  const [first] = thread;
  const last = thread.at(-1);
  if (first === undefined || last === undefined) return;
  const { conversationId } = first;
  const key = conversationQueries.messages(conversationId).queryKey;

  // An answer given while offline changes an older message, so a pending invite needs a full reload.
  const hasPendingInvite = thread.some((message) => message.invite?.status === 'pending');
  try {
    if (hasPendingInvite) {
      await queryClient.invalidateQueries({ queryKey: key });
      return;
    }
    const missed = await conversationApi.messages(conversationId, last.id);
    queryClient.setQueryData(key, (current) => current && mergeMessages(current, missed));
  } catch {
    await queryClient.invalidateQueries({ queryKey: key });
  }
}

/**
 * After a reconnect, asks for what arrived while the socket was away: the conversation list, and
 * the messages after the last one of every thread that is loaded, and the calendar.
 */
export async function catchUp(queryClient: QueryClient): Promise<void> {
  const threads = queryClient.getQueriesData<readonly Message[]>(conversationQueries.allMessages());
  await Promise.all([
    queryClient.invalidateQueries(conversationQueries.list()),
    queryClient.invalidateQueries(calendarQueries.all()),
    ...threads.map(([, thread]) => thread && catchUpThread(queryClient, thread)),
  ]);
}
