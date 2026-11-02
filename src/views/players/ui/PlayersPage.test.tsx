import { sampleConversations } from '@/entities/conversation';
import { InboxProvider } from '@/features/inbox';
import userEvent from '@testing-library/user-event';
import { render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { PlayersPage } from '../index';

vi.mock('next/navigation', async () => {
  const { createNavigation } = await import('@/shared/testing');
  return createNavigation('/players').module;
});

function renderPage(): void {
  render(
    <InboxProvider conversations={sampleConversations}>
      <PlayersPage />
    </InboxProvider>,
  );
}

describe('PlayersPage', () => {
  it('has one h1 and groups the page into labelled sections', () => {
    renderPage();

    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    expect(
      screen.getByRole('heading', { level: 1, name: 'Find players in Kraków' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Find players' })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: /Players/ })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: /Open games/ })).toBeInTheDocument();
  });

  it('starts with the level select on all levels', () => {
    renderPage();

    expect(screen.getByRole('button', { name: /Level/ })).toHaveTextContent('All levels');
  });

  it('starts with the best fits among players at the viewer level', () => {
    renderPage();

    const names = screen
      .getAllByRole('heading', { level: 3 })
      .map((heading) => heading.textContent)
      .slice(0, 4);
    expect(names).toEqual(['Marta K.', 'Piotr W.', 'Ola N.', 'Kuba S.']);
  });

  it('shows the three sample open games', () => {
    renderPage();

    const games = screen.getByRole('region', { name: /Open games/ });
    expect(within(games).getAllByRole('button', { name: /Join game/ })).toHaveLength(3);
  });

  it('shows the inbox and the next games', () => {
    renderPage();

    const inbox = screen.getByRole('region', { name: 'Inbox' });
    expect(within(inbox).getAllByRole('listitem')).toHaveLength(4);
    expect(within(inbox).getByText('Unread')).toBeInTheDocument();
    const next = screen.getByRole('region', { name: 'Next games' });
    expect(within(next).getByText('vs Piotr W.')).toBeInTheDocument();
  });

  describe('next games', () => {
    it('links each game to its day in the calendar', () => {
      renderPage();

      const next = screen.getByRole('region', { name: 'Next games' });
      expect(within(next).getByRole('link', { name: /vs Ola N\./ })).toHaveAttribute(
        'href',
        '/calendar?day=2026-11-04',
      );
    });
  });

  describe('inbox panel', () => {
    it('opens the full inbox from "Open all"', async () => {
      const user = userEvent.setup();
      renderPage();

      await user.click(screen.getByRole('button', { name: 'Open all' }));

      expect(screen.getByRole('dialog', { name: 'Messages' })).toBeInTheDocument();
    });

    it('opens the chat with the player when an inbox item is pressed', async () => {
      const user = userEvent.setup();
      renderPage();

      await user.click(
        within(screen.getByRole('region', { name: 'Inbox' })).getByRole('button', {
          name: /Piotr W\./,
        }),
      );

      const drawer = screen.getByRole('dialog', { name: 'Messages' });
      expect(within(drawer).getByRole('heading', { name: 'Piotr W.' })).toBeInTheDocument();
    });
  });
});
