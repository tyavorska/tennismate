import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import {
  applyMessageNew,
  conversationEvents,
  conversationMutationKeys,
  type InviteResponseRequest,
  type MessageNewEvent,
} from '@/entities/conversation';
import { calendarQueries } from '@/entities/game';
import type { ApiError } from '@/shared/api';
import { useSocket } from '@/shared/hooks';
import { emitWithAck } from './emitWithAck';

/** Accepts, declines or cancels an invite. An accepted game appears in the calendar at once. */
export function useRespondToInvite(): UseMutationResult<
  MessageNewEvent,
  ApiError,
  InviteResponseRequest
> {
  const socket = useSocket();
  const queryClient = useQueryClient();

  return useMutation<MessageNewEvent, ApiError, InviteResponseRequest>({
    mutationKey: conversationMutationKeys.respondToInvite,
    mutationFn: (request) => emitWithAck(socket, conversationEvents.respondToInvite, request),
    onSuccess: (event) => {
      applyMessageNew(queryClient, event);
      void queryClient.invalidateQueries(calendarQueries.all());
    },
  });
}
