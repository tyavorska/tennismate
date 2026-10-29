import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { playerSchema, rankMatches } from '@/entities/player';
import { MatchFinder } from '../index';

function makePlayer(id: string, name: string, readyToPlay: boolean) {
  return playerSchema.parse({
    id,
    name,
    rating: 3,
    about: '',
    neighborhood: 'Center City',
    location: { latitude: 39.9526, longitude: -75.1652 },
    lastActiveDaysAgo: 0,
    gamesPlayed: 3,
    readyToPlay,
    playTimes: ['weekends'],
    homeCourts: ['Fairmount Park'],
  });
}

const viewer = makePlayer('viewer', 'Viewer', false);
const matches = rankMatches(viewer, [
  makePlayer('maya', 'Maya Okafor', true),
  makePlayer('sam', 'Sam Whitaker', false),
]);

describe('MatchFinder', () => {
  it('shows a card for every matched player', () => {
    render(<MatchFinder matches={matches} />);

    expect(screen.getByRole('heading', { name: 'Find match' })).toBeInTheDocument();
    expect(screen.getByRole('article', { name: 'Maya Okafor' })).toBeInTheDocument();
    expect(screen.getByRole('article', { name: 'Sam Whitaker' })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'Best match' })).toBeChecked();
  });

  it('shows what both players share on the card', () => {
    render(<MatchFinder matches={matches} />);

    const card = screen.getByRole('article', { name: 'Maya Okafor' });
    expect(within(card).getByText('100%')).toBeInTheDocument();
    expect(within(card).getByText('Shared: Weekends')).toBeInTheDocument();
    expect(within(card).getByText('Shared: Fairmount Park')).toBeInTheDocument();
  });

  it('narrows the list to ready players and announces the result', async () => {
    const user = userEvent.setup();
    render(<MatchFinder matches={matches} />);

    await user.click(screen.getByRole('radio', { name: 'Ready to play' }));

    expect(screen.getByRole('article', { name: 'Maya Okafor' })).toBeInTheDocument();
    expect(screen.queryByRole('article', { name: 'Sam Whitaker' })).not.toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('1 of 2 players · Ready to play');
  });
});
