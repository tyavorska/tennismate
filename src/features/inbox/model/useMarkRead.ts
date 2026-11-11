import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  conversationApi,
  conversationQueries,
  markConversationRead,
} from '@/entities/conversation';
import type { ApiError } from '@/shared/api';

/** Clears the unread count at once. When the server refuses, the real count comes back. */
export function useMarkRead(): (conversationId: string) => void {
  const queryClient = useQueryClient();
  const { mutate } = useMutation<undefined, ApiError, string>({
    mutationFn: (conversationId) => conversationApi.markRead(conversationId),
    onMutate: (conversationId) => markConversationRead(queryClient, conversationId),
    onError: () => queryClient.invalidateQueries(conversationQueries.list()),
  });
  return mutate;
}
