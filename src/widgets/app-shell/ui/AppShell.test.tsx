import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { playerSchema } from '@/entities/player';
import { renderWithQuery } from '@/shared/testing';
import { AppShell } from '../index';

const router = vi.hoisted(() => ({ replace: vi.fn(), refresh: vi.fn(), push: vi.fn() }));
vi.mock('next/navigation', () => ({ useRouter: () => router, usePathname: () => '/players' }));

const viewer = playerSchema.parse({
  id: '2f1c6c8e-9a43-4b8b-9a55-0f6a7b3a1d10',
  name: 'Tania Ivanova',
  rating: 2,
  neighborhood: 'Stare Miasto',
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
      expect(nav).toContainElement(screen.getByRole('link', { name: 'Players' }));
      expect(screen.getByRole('link', { name: 'Players' })).toHaveAttribute('aria-current', 'page');
      expect(screen.getByRole('link', { name: 'Players' })).toHaveAttribute('href', '/players');
    });

    it('links to the calendar page without marking it as current', () => {
      renderShell();

      const link = screen.getByRole('link', { name: 'My calendar' });
      expect(link).toHaveAttribute('href', '/calendar');
      expect(link).not.toHaveAttribute('aria-current');
    });

    it('links the free-to-play shortcut to the offer form on the players page', () => {
      renderShell();

      expect(screen.getByRole('link', { name: "I'm free to play" })).toHaveAttribute(
        'href',
        '/players?offer=1',
      );
    });
  });

  describe('inbox', () => {
    it('shows the number of unread conversations on the Messages button', () => {
      renderShell();

      expect(screen.getByRole('button', { name: 'Messages, 1 unread' })).toBeInTheDocument();
    });

    it('opens the conversation list in a drawer', async () => {
      renderShell();
      const user = userEvent.setup();

      await user.click(screen.getByRole('button', { name: /Messages/ }));

      const drawer = screen.getByRole('dialog', { name: 'Messages' });
      expect(within(drawer).getAllByRole('listitem')).toHaveLength(6);
    });

    it('marks a conversation as read when it is opened', async () => {
      renderShell();
      const user = userEvent.setup();
      await user.click(screen.getByRole('button', { name: /Messages/ }));

      await user.click(screen.getByRole('button', { name: /Ola N\./ }));
      await user.click(screen.getByRole('button', { name: 'Back to messages' }));
      await user.click(screen.getByRole('button', { name: 'Close' }));

      expect(screen.getByRole('button', { name: 'Messages' })).toBeInTheDocument();
    });

    it('sends a reply into the open conversation', async () => {
      renderShell();
      const user = userEvent.setup();
      await user.click(screen.getByRole('button', { name: /Messages/ }));
      await user.click(screen.getByRole('button', { name: /Ola N\./ }));

      await user.type(screen.getByRole('textbox', { name: 'Message' }), 'See you at 10');
      await user.click(screen.getByRole('button', { name: 'Send' }));

      expect(screen.getByText('See you at 10')).toBeInTheDocument();
    });

    it('sends a quick reply', async () => {
      renderShell();
      const user = userEvent.setup();
      await user.click(screen.getByRole('button', { name: /Messages/ }));
      await user.click(screen.getByRole('button', { name: /Ola N\./ }));

      await user.click(screen.getByRole('button', { name: 'Sounds good' }));

      expect(screen.getByText('Sounds good', { selector: 'p' })).toBeInTheDocument();
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

    it('links to the profile settings page from the menu', async () => {
      renderShell();
      await openAccountMenu();

      expect(screen.getByRole('menuitem', { name: 'Profile settings' })).toHaveAttribute(
        'href',
        '/profile',
      );
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
