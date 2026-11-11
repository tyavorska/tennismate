import { queryOptions } from '@tanstack/react-query';
import { conversationApi } from './conversationApi';

export const conversationQueries = {
  all: () => ({ queryKey: ['conversations'] as const }),
  list: () =>
    queryOptions({
      queryKey: ['conversations', 'list'] as const,
      queryFn: () => conversationApi.list(),
    }),
  /** Every loaded thread, for catching up after a reconnect. */
  allMessages: () => ({ queryKey: ['conversations', 'messages'] as const }),
  messages: (conversationId: string) =>
    queryOptions({
      queryKey: ['conversations', 'messages', conversationId] as const,
      queryFn: () => conversationApi.messages(conversationId),
    }),
};

const nobodyOnline: readonly string[] = [];

/** Who is online. Filled by the socket, never fetched. */
export const presenceQueries = {
  online: () =>
    queryOptions({
      queryKey: ['presence'] as const,
      queryFn: (): readonly string[] => [],
      staleTime: Infinity,
      initialData: nobodyOnline,
    }),
};
