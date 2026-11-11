'use client';

import { createContext, useContext } from 'react';
import type { Socket } from 'socket.io-client';

export const SocketContext = createContext<Socket | undefined>(undefined);

/** The tab's one realtime connection. Payloads are plain JSON, so callers parse them with Zod. */
export function useSocket(): Socket {
  const socket = useContext(SocketContext);
  if (socket === undefined) throw new Error('useSocket needs a RealtimeProvider above it.');
  return socket;
}
