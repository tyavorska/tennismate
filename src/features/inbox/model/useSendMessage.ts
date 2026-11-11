import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import type { z } from 'zod';
import {
  applyMessageNew,
  conversationEvents,
  sendAckSchema,
  type MessageNewEvent,
  type SendMessageRequest,
} from '@/entities/conversation';
import { ApiError } from '@/shared/api';
import { useSocket } from '@/shared/hooks';
import type { Socket } from 'socket.io-client';

const ackTimeoutMs = 5000;

function sendOverSocket(socket: Socket, request: SendMessageRequest): Promise<MessageNewEvent> {
  return new Promise((resolve, reject) => {
    // A timeout is a network failure. Sending the same request again is safe: it carries the
    // same clientMessageId, so the server saves it once.
    socket
      .timeout(ackTimeoutMs)
      .emit(
        conversationEvents.send,
        request,
        (timedOut: Error | null, response: z.core.util.JSONType) => {
          if (timedOut !== null) return reject(new ApiError({ kind: 'network' }));
          const ack = sendAckSchema.safeParse(response);
          if (!ack.success) return reject(new ApiError({ kind: 'malformed' }));
          if (!ack.data.ok) return reject(new ApiError(ack.data.problem));
          resolve(ack.data.event);
        },
      );
  });
}

export function useSendMessage(): UseMutationResult<MessageNewEvent, ApiError, SendMessageRequest> {
  const socket = useSocket();
  const queryClient = useQueryClient();

  return useMutation<MessageNewEvent, ApiError, SendMessageRequest>({
    mutationFn: (request) => sendOverSocket(socket, request),
    onSuccess: (event) => applyMessageNew(queryClient, event),
  });
}
