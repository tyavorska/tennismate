import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { DashboardPage } from '../index';

describe('DashboardPage', () => {
  describe('structure', () => {
    it('has a single main heading that names the feed', () => {
      render(<DashboardPage />);

      expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Today in Kraków tennis');
    });

    it('lists the six updates, each with a title', () => {
      render(<DashboardPage />);

      const updates = screen.getByRole('region', { name: 'Latest updates' });
      expect(within(updates).getAllByRole('heading', { level: 3 })).toHaveLength(6);
      expect(within(updates).getByRole('heading', { name: '6 players free today' })).toBeVisible();
    });

    it('lists the stories as plain items, not as controls', () => {
      render(<DashboardPage />);

      const stories = screen.getByRole('region', { name: 'Latest Kraków Tennis Stories' });
      expect(within(stories).getAllByRole('listitem')).toHaveLength(4);
      expect(within(stories).queryByRole('button')).not.toBeInTheDocument();
      expect(within(stories).queryByRole('link')).not.toBeInTheDocument();
    });
  });

  describe('where each action leads', () => {
    it('sends the free-today and open-games cards to the players page', () => {
      render(<DashboardPage />);

      expect(screen.getByRole('link', { name: 'See who' })).toHaveAttribute('href', '/players');
      expect(screen.getByRole('link', { name: 'Join a game' })).toHaveAttribute('href', '/players');
    });

    it('links the next games to the calendar', () => {
      render(<DashboardPage />);

      expect(screen.getByRole('link', { name: 'Calendar →' })).toHaveAttribute('href', '/calendar');
    });

    it('links each next game to its day in the calendar', () => {
      render(<DashboardPage />);

      const games = screen.getByRole('region', { name: 'Your next games' });
      const links = within(games)
        .getAllByRole('link')
        .filter((link) => link.getAttribute('href')?.startsWith('/calendar?day='));
      expect(links.map((link) => link.getAttribute('href'))).toEqual([
        '/calendar?day=2026-11-02',
        '/calendar?day=2026-11-04',
        '/calendar?day=2026-11-07',
      ]);
    });

    it('opens the offer form and the level quiz on the players page from quick actions', () => {
      render(<DashboardPage />);

      const actions = screen.getByRole('region', { name: 'Quick actions' });
      expect(within(actions).getByRole('link', { name: 'Find a player' })).toHaveAttribute(
        'href',
        '/players',
      );
      expect(within(actions).getByRole('link', { name: "I'm free to play" })).toHaveAttribute(
        'href',
        '/players?offer=1',
      );
      expect(within(actions).getByRole('link', { name: "What's my level?" })).toHaveAttribute(
        'href',
        '/players?quiz=1',
      );
    });

    it('does not draw actions for pages that do not exist yet', () => {
      render(<DashboardPage />);

      for (const name of ['Sign up', 'Book a court', 'Log a match', 'Open community']) {
        expect(screen.queryByRole('link', { name })).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name })).not.toBeInTheDocument();
      }
    });
  });

  describe('side panels', () => {
    it('shows the next three games and the court offers', () => {
      render(<DashboardPage />);

      const games = screen.getByRole('region', { name: 'Your next games' });
      expect(within(games).getAllByRole('listitem')).toHaveLength(3);
      const offers = screen.getByRole('region', { name: 'Offers from courts' });
      expect(within(offers).getAllByRole('listitem')).toHaveLength(3);
    });
  });
});
