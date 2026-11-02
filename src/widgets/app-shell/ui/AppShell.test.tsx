import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { playerSchema } from '@/entities/player';
import { renderWithQuery } from '@/shared/testing';
import { AppShell } from '../index';

const router = vi.hoisted(() => ({ replace: vi.fn(), refresh: vi.fn(), push: vi.fn() }));
vi.mock('next/navigation', () => ({ useRouter: () => router, usePathname: () => '/home' }));

const viewer = playerSchema.parse({
  id: '2f1c6c8e-9a43-4b8b-9a55-0f6a7b3a1d10',
  name: 'Tania Ivanova',
  rating: 2,
  about: '',
  neighborhood: 'Center City',
  location: { latitude: 39.9526, longitude: -75.1652 },
  lastActiveDaysAgo: 0,
  gamesPlayed: 0,
  readyToPlay: false,
  playTimes: [],
  homeCourts: [],
});

function renderShell(): void {
  renderWithQuery(
    <AppShell viewer={viewer}>
      <p>Page content</p>
    </AppShell>,
  );
}

async function openAccountMenu(): Promise<ReturnType<typeof userEvent.setup>> {
  const user = userEvent.setup();
  await user.click(screen.getByRole('button', { name: /Tania/ }));
  return user;
}

beforeEach(() => {
  router.replace.mockReset();
  router.refresh.mockReset();
});

afterEach(() => vi.unstubAllGlobals());

describe('AppShell', () => {
  describe('navigation', () => {
    it('marks the current page in the main nav', () => {
      renderShell();

      const nav = screen.getByRole('navigation', { name: 'Main' });
      expect(nav).toContainElement(screen.getByRole('link', { name: 'Home' }));
      expect(screen.getByRole('link', { name: 'Home' })).toHaveAttribute('aria-current', 'page');
    });
  });

  describe('account menu', () => {
    it('shows the first name of the viewer', () => {
      renderShell();

      expect(screen.getByRole('button', { name: 'Tania' })).toBeInTheDocument();
    });

    it('opens a menu with sign out', async () => {
      renderShell();

      await openAccountMenu();

      expect(screen.getByRole('menu', { name: 'Tania' })).toBeInTheDocument();
      expect(screen.getByRole('menuitem', { name: 'Sign out' })).toBeInTheDocument();
    });

    it('signs out and goes to the landing page', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status: 204 })));
      renderShell();

      const user = await openAccountMenu();
      await user.click(screen.getByRole('menuitem', { name: 'Sign out' }));

      await waitFor(() => expect(router.replace).toHaveBeenCalledWith('/'));
      expect(router.refresh).toHaveBeenCalled();
    });

    it('shows an error when sign out fails', async () => {
      vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));
      renderShell();

      const user = await openAccountMenu();
      await user.click(screen.getByRole('menuitem', { name: 'Sign out' }));

      expect(await screen.findByRole('alert')).toHaveTextContent("We couldn't reach the server.");
      expect(router.replace).not.toHaveBeenCalled();
    });
  });
});
