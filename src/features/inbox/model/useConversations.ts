import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import {
  conversationQueries,
  presenceQueries,
  type Conversation,
  type Message,
} from '@/entities/conversation';

export function useConversations(): UseQueryResult<readonly Conversation[]> {
  return useQuery(conversationQueries.list());
}

/** The messages of a thread. A chat that has no conversation yet has no messages to load. */
export function useThreadMessages(
  conversationId: string | undefined,
): UseQueryResult<readonly Message[]> {
  return useQuery({
    ...conversationQueries.messages(conversationId ?? ''),
    enabled: conversationId !== undefined,
  });
}

export function useOnlineIds(): readonly string[] {
  return useQuery(presenceQueries.online()).data;
}

export function useIsOnline(playerId: string): boolean {
  return useOnlineIds().includes(playerId);
}
