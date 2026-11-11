'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState, type ReactNode } from 'react';
import { io } from 'socket.io-client';
import { publicEnv } from '@/shared/config';
import { SocketContext } from '@/shared/hooks';

/** One socket per tab, open while the signed-in app is on screen. Cookies authenticate it. */
export function RealtimeProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [socket] = useState(() =>
    io(publicEnv.NEXT_PUBLIC_REALTIME_URL, { autoConnect: false, withCredentials: true }),
  );

  useEffect(() => {
    // Only a refused session ends here. A network failure is retried by the socket itself.
    function onConnectError(error: Error): void {
      if (error.message !== 'unauthenticated') return;
      const here = `${window.location.pathname}${window.location.search}`;
      router.replace(`/sign-in?returnTo=${encodeURIComponent(here)}`);
    }

    socket.on('connect_error', onConnectError);
    socket.connect();
    return () => {
      socket.off('connect_error', onConnectError);
      socket.disconnect();
    };
  }, [socket, router]);

  return <SocketContext value={socket}>{children}</SocketContext>;
}
