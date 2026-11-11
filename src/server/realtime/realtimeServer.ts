import 'server-only';
import type { Server as HttpServer } from 'node:http';
import { Server, type Socket } from 'socket.io';
import type { z } from 'zod';
import {
  conversationEvents,
  sendMessageRequestSchema,
  type ClientToServerEvents,
  type SendAck,
  type ServerToClientEvents,
} from '@/entities/conversation';
import type { User } from '@/entities/user';
import type { Problem } from '@/shared/api';
import { sessionCookieName } from '@/shared/config';
import { findUserBySessionToken } from '../auth';
import { listPartnerIds, sendMessage } from '../conversations';
import { DomainError, fieldErrorsFrom } from '../http';
import { getProfile } from '../profiles';
import { readCookie } from './cookies';
import { createPresence } from './presence';
import { createSendLimit } from './sendLimit';

type SocketData = { user: User };
type RealtimeServer = Server<ClientToServerEvents, ServerToClientEvents, never, SocketData>;
type RealtimeSocket = Socket<ClientToServerEvents, ServerToClientEvents, never, SocketData>;

const maxPayloadBytes = 16 * 1024;

export function userRoom(userId: string): string {
  return `user:${userId}`;
}

function problemFrom(error: Error | string): Problem {
  if (error instanceof DomainError) {
    return { kind: error.kind, message: error.publicMessage, fieldErrors: error.fieldErrors };
  }
  console.error(
    JSON.stringify({
      level: 'error',
      kind: 'server',
      operation: 'realtime',
      detail: error instanceof Error ? error.message : error,
    }),
  );
  return { kind: 'server' };
}

/**
 * Attaches the messaging server to an HTTP server. Players are identified by the session cookie
 * of the handshake. Each player has one room, so every open tab receives their messages.
 */
export function createRealtimeServer(
  httpServer: HttpServer,
  { allowedOrigin }: Readonly<{ allowedOrigin: string }>,
): RealtimeServer {
  const io: RealtimeServer = new Server(httpServer, {
    cors: { origin: allowedOrigin, credentials: true },
    maxHttpBufferSize: maxPayloadBytes,
  });
  const presence = createPresence();
  const sendLimit = createSendLimit();

  io.use((socket, next) => {
    const token = readCookie(socket.handshake.headers.cookie, sessionCookieName);
    const user = token === undefined ? undefined : findUserBySessionToken(token);
    // Messaging needs a city, so a player without a profile cannot connect.
    if (user === undefined || getProfile(user) === undefined) {
      next(new Error('unauthenticated'));
      return;
    }
    socket.data.user = user;
    next();
  });

  function announce(userId: string, online: boolean): void {
    for (const partnerId of listPartnerIds(userId)) {
      io.to(userRoom(partnerId)).emit(conversationEvents.presenceUpdate, { userId, online });
    }
  }

  function handleSend(
    socket: RealtimeSocket,
    payload: z.core.util.JSONType,
    acknowledge: ((ack: SendAck) => void) | undefined,
  ): void {
    if (typeof acknowledge !== 'function') return;
    const reply = (ack: SendAck): void => acknowledge(ack);
    const { user } = socket.data;

    const limit = sendLimit.check(user.id);
    if (!limit.allowed) {
      reply({ ok: false, problem: { kind: 'rateLimited' } });
      return;
    }
    const parsed = sendMessageRequestSchema.safeParse(payload);
    if (!parsed.success) {
      reply({
        ok: false,
        problem: { kind: 'validation', fieldErrors: fieldErrorsFrom(parsed.error) },
      });
      return;
    }

    try {
      const sent = sendMessage(user, parsed.data);
      io.to(userRoom(sent.recipientId)).emit(conversationEvents.messageNew, sent.forRecipient);
      // The author's other tabs get it too. This tab gets it as the acknowledgement as well.
      socket.to(userRoom(user.id)).emit(conversationEvents.messageNew, sent.forSender);
      // A new conversation has no presence yet on either side.
      io.to(userRoom(user.id)).emit(conversationEvents.presenceUpdate, {
        userId: sent.recipientId,
        online: presence.isOnline(sent.recipientId),
      });
      io.to(userRoom(sent.recipientId)).emit(conversationEvents.presenceUpdate, {
        userId: user.id,
        online: true,
      });
      reply({ ok: true, event: sent.forSender });
    } catch (error) {
      reply({ ok: false, problem: problemFrom(error instanceof Error ? error : String(error)) });
    }
  }

  io.on('connection', (socket) => {
    const { user } = socket.data;
    void socket.join(userRoom(user.id));

    if (presence.connect(user.id)) announce(user.id, true);
    socket.emit(conversationEvents.presenceSnapshot, {
      onlineIds: presence.onlineAmong(listPartnerIds(user.id)),
    });

    socket.on(conversationEvents.send, (payload, acknowledge) =>
      handleSend(socket, payload, acknowledge),
    );

    socket.on('disconnect', () => {
      if (presence.disconnect(user.id)) announce(user.id, false);
    });
  });

  return io;
}
