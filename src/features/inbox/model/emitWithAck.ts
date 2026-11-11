import type { Socket } from 'socket.io-client';
import type { z } from 'zod';
import { sendAckSchema, type MessageNewEvent } from '@/entities/conversation';
import { ApiError } from '@/shared/api';

const ackTimeoutMs = 5000;

/**
 * Sends a request over the socket and waits for the server's answer. A timeout is a network
 * failure. Repeating a request is safe: a message carries the same clientMessageId, and an invite
 * answer repeated does nothing.
 */
export function emitWithAck(
  socket: Socket,
  event: string,
  request: z.core.util.JSONType,
): Promise<MessageNewEvent> {
  return new Promise((resolve, reject) => {
    socket
      .timeout(ackTimeoutMs)
      .emit(event, request, (timedOut: Error | null, response: z.core.util.JSONType) => {
        if (timedOut !== null) return reject(new ApiError({ kind: 'network' }));
        const ack = sendAckSchema.safeParse(response);
        if (!ack.success) return reject(new ApiError({ kind: 'malformed' }));
        if (!ack.data.ok) return reject(new ApiError(ack.data.problem));
        resolve(ack.data.event);
      });
  });
}
