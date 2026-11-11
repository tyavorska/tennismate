'use client';

import type { ReactNode } from 'react';
import { io, type Socket } from 'socket.io-client';
import type { z } from 'zod';
import { SocketContext } from '../hooks/useSocket';

type Json = z.core.util.JSONType;

type AckHandler = (response: Json) => void;

type TestSocketOptions = {
  /** Answers a send. Receives the payload and calls `acknowledge` with the server's reply. */
  onSend?: (payload: Json, acknowledge: AckHandler) => void;
};

/** A socket that never connects. Sends go to `onSend` instead of a server, and wait forever without it. */
export function createTestSocket({ onSend }: TestSocketOptions = {}): Socket {
  const socket = io('http://localhost:0', { autoConnect: false });
  Object.defineProperty(socket, 'timeout', {
    value: () => ({
      emit: (_event: string, payload: Json, done: (error: Error | null, response: Json) => void) =>
        onSend?.(payload, (response) => done(null, response)),
    }),
  });
  return socket;
}

type TestRealtimeProps = {
  socket?: Socket;
  children: ReactNode;
};

export function TestRealtime({ socket = createTestSocket(), children }: TestRealtimeProps) {
  return <SocketContext value={socket}>{children}</SocketContext>;
}
