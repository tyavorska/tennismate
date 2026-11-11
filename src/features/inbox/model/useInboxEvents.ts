import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import type { z } from 'zod';
import {
  applyMessageNew,
  applyPresenceSnapshot,
  applyPresenceUpdate,
  conversationEvents,
  messageNewEventSchema,
  presenceSnapshotSchema,
  presenceUpdateSchema,
} from '@/entities/conversation';
import { useSocket } from '@/shared/hooks';
import { catchUp } from './catchUp';

type Json = z.core.util.JSONType;

/** Puts what the server pushes into the query cache: new messages and who is online. */
export function useInboxEvents(): void {
  const socket = useSocket();
  const queryClient = useQueryClient();

  useEffect(() => {
    let hasConnected = socket.connected;

    function onConnect(): void {
      if (hasConnected) void catchUp(queryClient);
      hasConnected = true;
    }

    // Presence is only known while connected, so everyone is offline until the socket is back.
    function onDisconnect(): void {
      applyPresenceSnapshot(queryClient, { onlineIds: [] });
    }

    // Events cross the network, so each one is parsed and a bad one is dropped.
    const onMessageNew = (payload: Json): void => {
      const event = messageNewEventSchema.safeParse(payload);
      if (event.success) applyMessageNew(queryClient, event.data);
    };
    const onSnapshot = (payload: Json): void => {
      const snapshot = presenceSnapshotSchema.safeParse(payload);
      if (snapshot.success) applyPresenceSnapshot(queryClient, snapshot.data);
    };
    const onUpdate = (payload: Json): void => {
      const update = presenceUpdateSchema.safeParse(payload);
      if (update.success) applyPresenceUpdate(queryClient, update.data);
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on(conversationEvents.messageNew, onMessageNew);
    socket.on(conversationEvents.presenceSnapshot, onSnapshot);
    socket.on(conversationEvents.presenceUpdate, onUpdate);
    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off(conversationEvents.messageNew, onMessageNew);
      socket.off(conversationEvents.presenceSnapshot, onSnapshot);
      socket.off(conversationEvents.presenceUpdate, onUpdate);
    };
  }, [socket, queryClient]);
}
