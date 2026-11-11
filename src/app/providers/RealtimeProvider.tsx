'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { io } from 'socket.io-client';
import { publicEnv } from '@/shared/config';
import { SocketContext } from '@/shared/hooks';

/** One socket per tab, open while the signed-in app is on screen. Cookies authenticate it. */
export function RealtimeProvider({ children }: { children: ReactNode }) {
  const [socket] = useState(() =>
    io(publicEnv.NEXT_PUBLIC_REALTIME_URL, { autoConnect: false, withCredentials: true }),
  );

  useEffect(() => {
    socket.connect();
    return () => {
      socket.disconnect();
    };
  }, [socket]);

  return <SocketContext value={socket}>{children}</SocketContext>;
}
