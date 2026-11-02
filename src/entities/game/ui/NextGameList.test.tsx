import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { sampleNextGames } from '../index';
import { NextGameList } from './NextGameList';

describe('NextGameList', () => {
  it('shows a date tile, the opponent, the time and court, and the status of each game', () => {
    render(<NextGameList games={sampleNextGames} />);

    const first = screen.getByRole('link', { name: /vs Piotr W\./ });
    expect(within(first).getByText('Today')).toBeInTheDocument();
    expect(within(first).getByText('2')).toBeInTheDocument();
    expect(within(first).getByText('19:00 · Kazimierz Clay Club')).toBeInTheDocument();
    expect(within(first).getByText('✓ Confirmed')).toBeInTheDocument();
  });

  it('says when a game is still waiting for a reply', () => {
    render(<NextGameList games={sampleNextGames} />);

    const last = screen.getByRole('link', { name: /Doubles open/ });
    expect(within(last).getByText('Waiting for reply')).toBeInTheDocument();
  });

  it('opens the day of each game in the calendar', () => {
    render(<NextGameList games={sampleNextGames} />);

    expect(screen.getAllByRole('link').map((link) => link.getAttribute('href'))).toEqual([
      '/calendar?day=2026-11-02',
      '/calendar?day=2026-11-04',
      '/calendar?day=2026-11-07',
    ]);
  });
});
