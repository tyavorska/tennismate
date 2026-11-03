import { sampleConversations } from '@/entities/conversation';
import {
  ntrpRatingSchema,
  openGameQueries,
  openGameSchema,
  playerListingSchema,
  playerQueries,
} from '@/entities/player';
import { InboxProvider } from '@/features/inbox';
import { createTestQueryClient, renderWithQuery } from '@/shared/testing';
import userEvent from '@testing-library/user-event';
import { screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { PlayersPage } from '../index';

vi.mock('next/navigation', async () => {
  const { createNavigation } = await import('@/shared/testing');
  return createNavigation('/players').module;
});

function listing(id: string, name: string, rating: number, fitPercent: number) {
  return playerListingSchema.parse({
    id,
    name,
    age: 30,
    rating,
    district: 'Kazimierz',
    distanceKm: 1,
    fitPercent,
    playStyle: 'Match play',
    formats: ['singles'],
    times: [],
    freeTonight: false,
    online: false,
    isNew: false,
    wantsDoublesPartner: false,
  });
}

const players = [
  listing('marta', 'Marta K.', 3.5, 94),
  listing('piotr', 'Piotr W.', 3.5, 91),
  listing('ola', 'Ola N.', 3, 88),
  listing('kuba', 'Kuba S.', 4, 86),
  listing('hanna', 'Hanna V.', 5, 62),
];

const courts = [{ name: 'Kazimierz Clay Club', district: 'Kazimierz' }];

const games = ['Piotr W.', 'Ola N.', 'Kuba S.'].map((host, index) =>
  openGameSchema.parse({
    id: `game-${index}`,
    hostName: host,
    hostInitials: host.slice(0, 2),
    rating: 3.5,
    format: 'singles',
    day: 'Today',
    time: '19:00',
    court: 'Kazimierz Clay Club',
    district: 'Kazimierz',
    spotsOpen: 1,
    isMine: false,
    isJoined: false,
  }),
);

function renderPage(): void {
  const client = createTestQueryClient();
  client.setQueryData(openGameQueries.list().queryKey, games);
  client.setQueryData(playerQueries.saved().queryKey, []);
  renderWithQuery(
    <InboxProvider conversations={sampleConversations}>
      <PlayersPage players={players} courts={courts} viewerRating={ntrpRatingSchema.parse(3.5)} />
    </InboxProvider>,
    client,
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

  it('shows the open games', () => {
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
