import { render } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { RealtimeProvider } from './RealtimeProvider';

const router = vi.hoisted(() => ({ replace: vi.fn() }));
vi.mock('next/navigation', () => ({ useRouter: () => router }));

const socket = vi.hoisted(() => ({
  handlers: new Map<string, (error: Error) => void>(),
  on: vi.fn((event: string, handler: (error: Error) => void) =>
    socket.handlers.set(event, handler),
  ),
  off: vi.fn((event: string) => socket.handlers.delete(event)),
  connect: vi.fn(),
  disconnect: vi.fn(),
}));
vi.mock('socket.io-client', () => ({ io: () => socket }));

beforeEach(() => {
  socket.handlers.clear();
  router.replace.mockReset();
  window.history.pushState({}, '', '/players?offer=1');
});

describe('RealtimeProvider', () => {
  it('sends the player to sign in, and back here afterwards, when the session is refused', () => {
    render(<RealtimeProvider>content</RealtimeProvider>);

    socket.handlers.get('connect_error')?.(new Error('unauthenticated'));

    expect(router.replace).toHaveBeenCalledWith('/sign-in?returnTo=%2Fplayers%3Foffer%3D1');
  });

  it('leaves the socket to retry when the connection fails for another reason', () => {
    render(<RealtimeProvider>content</RealtimeProvider>);

    socket.handlers.get('connect_error')?.(new Error('websocket error'));

    expect(router.replace).not.toHaveBeenCalled();
  });

  it('closes the connection when the app is left', () => {
    const { unmount } = render(<RealtimeProvider>content</RealtimeProvider>);

    unmount();

    expect(socket.disconnect).toHaveBeenCalled();
    expect(socket.handlers.size).toBe(0);
  });
});
