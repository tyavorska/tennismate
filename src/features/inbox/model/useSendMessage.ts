import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import {
  applyMessageNew,
  conversationEvents,
  conversationQueries,
  conversationMutationKeys,
  type MessageNewEvent,
  type SendMessageRequest,
} from '@/entities/conversation';
import type { ApiError } from '@/shared/api';
import { useSocket } from '@/shared/hooks';
import { emitWithAck } from './emitWithAck';

export function useSendMessage(): UseMutationResult<MessageNewEvent, ApiError, SendMessageRequest> {
  const socket = useSocket();
  const queryClient = useQueryClient();

  return useMutation<MessageNewEvent, ApiError, SendMessageRequest>({
    mutationKey: conversationMutationKeys.send,
    mutationFn: (request) => emitWithAck(socket, conversationEvents.send, request),
    onSuccess: (event) => applyMessageNew(queryClient, event),
    // A refused send can mean the other account was just deleted, so show it as deleted at once.
    onError: (error) => {
      if (error.kind === 'conflict') {
        void queryClient.invalidateQueries({ queryKey: conversationQueries.all().queryKey });
      }
    },
  });
}
