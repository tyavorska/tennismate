import { act, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { z } from 'zod';
import {
  newGameSchema,
  ntrpRatingSchema,
  openGameQueries,
  openGameSchema,
  playerListingSchema,
  playerQueries,
  type OpenGame,
  type PlayerListing,
} from '@/entities/player';
import { conversationQueries } from '@/entities/conversation';
import { courtQueries } from '@/entities/court';
import {
  createTestQueryClient,
  createTestSocket,
  renderWithQuery,
  TestRealtime,
} from '@/shared/testing';
import { InboxProvider } from '@/features/inbox';
import { PlayerFinder } from '../index';

const navigation = await vi.hoisted(async () => {
  const { createNavigation } = await import('@/shared/testing');
  return createNavigation('/players');
});
vi.mock('next/navigation', () => navigation.module);

const onSend = vi.fn();

beforeEach(() => {
  navigation.setUrl('/players');
  onSend.mockClear();
});
afterEach(() => vi.unstubAllGlobals());

function player(
  id: string,
  overrides: Partial<z.input<typeof playerListingSchema>> = {},
): PlayerListing {
  return playerListingSchema.parse({
    id,
    name: `${id} K.`,
    age: 30,
    rating: 3.5,
    district: 'Podgórze',
    distanceKm: 2,
    fitPercent: 80,
    playStyle: 'Match play',
    formats: ['singles', 'doubles'],
    times: [],
    freeTonight: false,
    online: false,
    isNew: false,
    wantsDoublesPartner: false,
    ...overrides,
  });
}

const players = [
  player('Marta', { fitPercent: 94, freeTonight: true, online: true }),
  player('Piotr', { fitPercent: 91, district: 'Kazimierz', distanceKm: 0.9 }),
  player('Kuba', { rating: 4, fitPercent: 86 }),
  player('Dawid', { rating: 2.5, fitPercent: 70 }),
];

const games: readonly OpenGame[] = [
  openGameSchema.parse({
    id: 'g1',
    hostName: 'Piotr W.',
    hostInitials: 'PW',
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
];

const courts = [
  { name: 'Kazimierz Clay Club', district: 'Kazimierz' },
  { name: 'Park Jordana', district: 'Krowodrza' },
];

type FakeServer = { games: OpenGame[]; saved: string[]; failNext?: Response };

function json(body: z.core.util.JSONType, status = 200): Response {
  return new Response(JSON.stringify(body), { status });
}

function problemResponse(kind: string, status: number, message: string): Response {
  return json({ kind, message }, status);
}

/** Stands in for the API: keeps games and saved players in memory and answers like the server does. */
function installFakeApi(server: FakeServer): void {
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
      if (server.failNext !== undefined) {
        const failure = server.failNext;
        server.failNext = undefined;
        return failure;
      }
      const method = init?.method ?? 'GET';
      const path = new URL(String(input), 'http://localhost').pathname;
      const [, , resource, id, rest] = path.split('/');

      if (resource === 'me') return handleSaved(server, method, path.split('/')[4]);
      if (method === 'GET') return json(server.games);
      if (method === 'POST') return handleCreate(server, String(init?.body));

      const game = server.games.find((candidate) => candidate.id === id);
      if (game === undefined)
        return problemResponse('notFound', 404, 'This game no longer exists.');
      if (rest === undefined) {
        server.games = server.games.filter((candidate) => candidate.id !== id);
        return new Response(null, { status: 204 });
      }
      if (method === 'PUT' && game.spotsOpen === 0) {
        return problemResponse('conflict', 409, 'This game is full.');
      }
      const joined = method === 'PUT';
      const updated = openGameSchema.parse({
        ...game,
        isJoined: joined,
        spotsOpen: game.spotsOpen + (joined ? -1 : 1),
      });
      server.games = server.games.map((candidate) => (candidate.id === id ? updated : candidate));
      return json(updated);
    }),
  );
}

function handleSaved(server: FakeServer, method: string, id: string | undefined): Response {
  if (method === 'GET' || id === undefined) return json(server.saved);
  server.saved =
    method === 'PUT' ? [...server.saved, id] : server.saved.filter((saved) => saved !== id);
  return new Response(null, { status: 204 });
}

function handleCreate(server: FakeServer, body: string): Response {
  const offer = newGameSchema.parse(JSON.parse(body));
  const court = courts.find((candidate) => candidate.name === offer.court);
  const game = openGameSchema.parse({
    id: `mine-${server.games.length + 1}`,
    hostName: 'You',
    hostInitials: 'You',
    rating: offer.rating,
    format: offer.format,
    day: offer.day,
    time: offer.time,
    court: offer.court,
    district: court?.district ?? 'Kazimierz',
    spotsOpen: offer.format === 'doubles' ? 3 : 1,
    isMine: true,
    isJoined: false,
  });
  server.games = [game, ...server.games];
  return json(game, 201);
}

let server: FakeServer = { games: [], saved: [] };

function renderFinder(initialDialog?: 'offer' | 'quiz'): ReturnType<typeof userEvent.setup> {
  if (initialDialog !== undefined) navigation.setUrl(`/players?${initialDialog}=1`);
  server = { games: [...games], saved: [] };
  installFakeApi(server);
  const client = createTestQueryClient();
  client.setQueryData(openGameQueries.list().queryKey, server.games);
  client.setQueryData(playerQueries.saved().queryKey, server.saved);
  client.setQueryData(conversationQueries.list().queryKey, []);
  client.setQueryData(courtQueries.list().queryKey, courts);
  renderWithQuery(
    <TestRealtime socket={createTestSocket({ onSend })}>
      <InboxProvider
        viewer={{ id: '00000000-0000-4000-8000-000000000001', timezone: 'Europe/Warsaw' }}
      >
        <PlayerFinder
          players={players}
          courts={courts}
          viewerRating={ntrpRatingSchema.parse(3.5)}
          aside={<aside aria-label="Side panel">Side content</aside>}
        />
      </InboxProvider>
    </TestRealtime>,
    client,
  );
  return userEvent.setup();
}

async function openMoreFilters(user: ReturnType<typeof userEvent.setup>): Promise<void> {
  await user.click(screen.getByRole('button', { name: /More filters/ }));
}

function summary(): string {
  return screen.getByText(/open games? match/).textContent ?? '';
}

function playerNames(): readonly string[] {
  return screen
    .getAllByRole('heading', { level: 3, hidden: true })
    .map((heading) => heading.textContent ?? '')
    .filter((name) => name.includes(' K.'));
}

describe('PlayerFinder', () => {
  describe('filters', () => {
    it('starts with the "At your level" list on and reports how many players and games match', async () => {
      const user = renderFinder();

      expect(screen.getByRole('button', { name: 'More filters · 1' })).toHaveAttribute(
        'aria-expanded',
        'false',
      );
      await openMoreFilters(user);
      expect(screen.getByRole('checkbox', { name: 'At your level' })).toBeChecked();
      expect(summary()).toBe('3 players and 1 open game match');
    });

    it('updates the result count when a list is switched on', async () => {
      const user = renderFinder();

      await openMoreFilters(user);
      await user.click(screen.getByRole('checkbox', { name: 'Free tonight' }));

      expect(summary()).toBe('1 player and 1 open game match');
      expect(playerNames()).toEqual(['Marta K.']);
    });

    it('lists courts under their districts in one dropdown with checkboxes', async () => {
      const user = renderFinder();

      await user.click(screen.getByRole('button', { name: 'District and court: All of Kraków' }));

      const list = screen.getByRole('dialog', { name: 'District and court' });
      const labels = within(list)
        .getAllByRole('checkbox')
        .map((box) => box.closest('label')?.textContent ?? '');
      expect(labels).toEqual([
        'All of Kraków',
        'Kazimierz',
        'Kazimierz Clay Club',
        'Krowodrza',
        'Park Jordana',
        'Podgórze',
      ]);
    });

    it('filters by every ticked district or court and goes back to all of Kraków', async () => {
      const user = renderFinder();
      await user.click(screen.getByRole('button', { name: 'Clear filters' }));
      await user.click(screen.getByRole('button', { name: 'District and court: All of Kraków' }));
      const list = screen.getByRole('dialog', { name: 'District and court' });
      expect(within(list).getByRole('checkbox', { name: 'All of Kraków' })).toBeChecked();

      await user.click(within(list).getByRole('checkbox', { name: 'Kazimierz' }));

      expect(within(list).getByRole('checkbox', { name: 'All of Kraków' })).not.toBeChecked();
      expect(playerNames()).toEqual(['Piotr K.']);
      expect(summary()).toContain('1 open game');

      await user.click(within(list).getByRole('checkbox', { name: 'Park Jordana' }));
      expect(
        screen.getByRole('button', { name: 'District and court: 2 selected', hidden: true }),
      ).toBeVisible();
      expect(playerNames()).toEqual(['Piotr K.']);

      await user.click(within(list).getByRole('checkbox', { name: 'All of Kraków' }));
      expect(within(list).getByRole('checkbox', { name: 'Kazimierz' })).not.toBeChecked();
      expect(playerNames()).toHaveLength(4);
    });

    it('treats a ticked court as its district for players and as the court itself for games', async () => {
      const user = renderFinder();
      await user.click(screen.getByRole('button', { name: 'Clear filters' }));
      await user.click(screen.getByRole('button', { name: 'District and court: All of Kraków' }));

      await user.click(screen.getByRole('checkbox', { name: 'Kazimierz Clay Club' }));

      expect(playerNames()).toEqual(['Piotr K.']);
      expect(summary()).toBe('1 player and 1 open game match');

      await user.click(screen.getByRole('checkbox', { name: 'Kazimierz Clay Club' }));
      await user.click(screen.getByRole('checkbox', { name: 'Park Jordana' }));
      expect(summary()).toBe('0 players and 0 open games match');
    });

    it('shows every player after "Clear filters"', async () => {
      const user = renderFinder();

      await user.click(screen.getByRole('button', { name: 'Clear filters' }));

      expect(summary()).toContain('4 players');
      await openMoreFilters(user);
      expect(screen.getByRole('checkbox', { name: 'At your level' })).not.toBeChecked();
    });

    it('narrows the players when a level is chosen in the level select', async () => {
      const user = renderFinder();

      await user.click(screen.getByRole('button', { name: /Level/ }));
      await user.click(screen.getByRole('option', { name: '4.0' }));

      expect(playerNames()).toEqual(['Kuba K.']);
    });

    it('filters by the search text', async () => {
      const user = renderFinder();

      await user.type(screen.getByRole('searchbox', { name: 'Search players' }), 'kazim');

      expect(playerNames()).toEqual(['Piotr K.']);
    });

    it('filters by a format chip', async () => {
      const user = renderFinder();

      await user.click(screen.getByRole('button', { name: 'Tonight' }));

      expect(playerNames()).toEqual(['Marta K.']);
    });

    it('keeps the level of the viewer under "More filters"', async () => {
      const user = renderFinder();

      await openMoreFilters(user);

      expect(screen.getByRole('button', { name: /I play at/ })).toHaveTextContent('3.5');
    });

    it('lists players best fit first', () => {
      renderFinder();

      expect(playerNames()).toEqual(['Marta K.', 'Piotr K.', 'Kuba K.']);
    });
  });

  describe('players', () => {
    it('shows the facts on a player card', () => {
      renderFinder();

      const card = screen.getByRole('heading', { name: 'Marta K.' }).closest('li');
      expect(card).not.toBeNull();
      if (card === null) return;
      expect(within(card).getByText('NTRP 3.5')).toBeInTheDocument();
      expect(within(card).getByText('Free tonight')).toBeInTheDocument();
      expect(within(card).getByText(/Podgórze · 2\.0 km · 94% fit/)).toBeInTheDocument();
      expect(within(card).getByText('Singles / Doubles')).toBeInTheDocument();
    });

    it('saves a player and lists them under "Saved players"', async () => {
      const user = renderFinder();

      await user.click(screen.getByRole('button', { name: 'Save Piotr K.' }));
      expect(await screen.findByText('Piotr K. saved.')).toBeInTheDocument();
      await openMoreFilters(user);
      await user.click(screen.getByRole('checkbox', { name: 'At your level' }));
      await user.click(screen.getByRole('checkbox', { name: 'Saved players' }));

      expect(screen.getByRole('button', { name: 'Save Piotr K.' })).toHaveAttribute(
        'aria-pressed',
        'true',
      );
      expect(playerNames()).toEqual(['Piotr K.']);
      expect(server.saved).toHaveLength(1);
    });

    it('puts the bookmark back and says so when saving fails', async () => {
      const user = renderFinder();
      server.failNext = problemResponse('server', 500, 'Something went wrong on our side.');

      await user.click(screen.getByRole('button', { name: 'Save Piotr K.' }));

      expect(await screen.findByText(/Piotr K. was not updated/)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Save Piotr K.' })).toHaveAttribute(
        'aria-pressed',
        'false',
      );
    });

    it('opens the chat with the invite form when you press "Let\'s play"', async () => {
      const user = renderFinder();

      await user.click(screen.getByRole('button', { name: "Let's play with Piotr K." }));

      const chat = screen.getByRole('dialog', { name: 'Messages' });
      expect(within(chat).getByRole('heading', { name: 'Piotr K.' })).toBeInTheDocument();
      expect(within(chat).getByText('No court booked yet')).toBeInTheDocument();
      expect(within(chat).getByRole('form', { name: 'Propose a court' })).toBeInTheDocument();
      expect(within(chat).getByText('Say hi to Piotr.')).toBeInTheDocument();
    });

    it('offers the courts of the city and sends the chosen invite as a message', async () => {
      const user = renderFinder();
      await user.click(screen.getByRole('button', { name: "Let's play with Marta K." }));
      const chat = screen.getByRole('dialog', { name: 'Messages' });

      await user.click(within(chat).getByRole('button', { name: /Time/ }));
      await user.click(screen.getByRole('option', { name: '18:00' }));
      await user.click(within(chat).getByRole('button', { name: /Send "let's play" invite/ }));

      expect(onSend).toHaveBeenCalledWith(
        expect.objectContaining({
          invite: {
            court: courts[0]?.name,
            date: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
            time: '18:00',
          },
        }),
        expect.any(Function),
        expect.any(Function),
      );
    });

    it('shows all players in a grid with a sort control and goes back to the lists', async () => {
      const user = renderFinder();

      await user.click(screen.getByRole('button', { name: 'See all' }));

      expect(screen.queryByRole('heading', { name: /Open games/ })).not.toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Sort/ })).toBeInTheDocument();

      await user.click(screen.getByRole('button', { name: /All lists/ }));

      expect(screen.getByRole('heading', { name: /Open games/ })).toBeInTheDocument();
    });

    it('sorts by distance in the grid', async () => {
      const user = renderFinder();

      await user.click(screen.getByRole('button', { name: 'See all' }));
      await user.click(screen.getByRole('button', { name: /Sort/ }));
      await user.click(screen.getByRole('option', { name: 'Closest' }));

      expect(playerNames()[0]).toBe('Piotr K.');
    });
  });

  describe('open games', () => {
    it('joins and leaves a game', async () => {
      const user = renderFinder();

      await user.click(screen.getByRole('button', { name: 'Join game' }));

      expect(await screen.findByRole('button', { name: 'Joined' })).toHaveAttribute(
        'aria-pressed',
        'true',
      );
      expect(screen.getByText('Full')).toBeInTheDocument();

      await user.click(screen.getByRole('button', { name: 'Joined' }));

      expect(await screen.findByText('1 spot open')).toBeInTheDocument();
    });

    it('says why joining failed and shows the game as the server has it', async () => {
      const user = renderFinder();
      server.games = server.games.map((game) => openGameSchema.parse({ ...game, spotsOpen: 0 }));

      await user.click(screen.getByRole('button', { name: 'Join game' }));

      expect(
        await screen.findByText(/You did not join the game. This game is full./),
      ).toBeInTheDocument();
      expect(await screen.findByText('Full')).toBeInTheDocument();
    });
  });

  describe('offering yourself as a player', () => {
    it('opens a dialog with the form', async () => {
      const user = renderFinder();

      await user.click(screen.getByRole('button', { name: 'Offer a game' }));

      const dialog = screen.getByRole('dialog', { name: 'Offer myself as a player' });
      expect(within(dialog).getByRole('button', { name: /Day/ })).toHaveTextContent('Today');
      expect(within(dialog).getByText('Today · 18:30')).toBeInTheDocument();
      expect(
        within(dialog).getByText(/Singles · NTRP 3\.5 · Kazimierz Clay Club/),
      ).toBeInTheDocument();
    });

    it('closes on Escape and returns focus to the button that opened it', async () => {
      const user = renderFinder();
      const trigger = screen.getByRole('button', { name: 'Offer a game' });

      await user.click(trigger);
      await user.keyboard('{Escape}');

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      await waitFor(() => expect(trigger).toHaveFocus());
    });

    it('closes with the close button', async () => {
      const user = renderFinder();

      await user.click(screen.getByRole('button', { name: 'Offer a game' }));
      await user.click(screen.getByRole('button', { name: 'Close' }));

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('adds the posted game first, marked as yours, and lets you remove it', async () => {
      const user = renderFinder();

      await user.click(screen.getByRole('button', { name: 'Offer a game' }));
      await user.click(screen.getByRole('button', { name: 'Post my game' }));

      await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
      const gameCards = screen
        .getAllByRole('heading', { level: 3 })
        .filter((heading) => /Club|Park/.test(heading.textContent ?? ''));
      expect(gameCards[0]).toHaveTextContent('Kazimierz Clay Club');
      expect(screen.getByText('Your post')).toBeInTheDocument();
      expect(screen.getByText('Visible to players')).toBeInTheDocument();
      expect(summary()).toContain('2 open games');

      await user.click(screen.getByRole('button', { name: 'Remove' }));

      await waitFor(() => expect(screen.queryByText('Your post')).not.toBeInTheDocument());
      expect(summary()).toContain('1 open game');
    });

    it('shows the server message for a select field, such as a time that has passed', async () => {
      const user = renderFinder();
      await user.click(screen.getByRole('button', { name: 'Offer a game' }));
      await user.type(screen.getByRole('textbox', { name: 'Note' }), 'Bring balls');
      server.failNext = json(
        { kind: 'validation', fieldErrors: { time: 'Choose a time that has not passed.' } },
        422,
      );

      await user.click(screen.getByRole('button', { name: 'Post my game' }));

      expect(await screen.findByRole('alert')).toHaveTextContent(
        'Choose a time that has not passed.',
      );
      expect(screen.getByRole('dialog', { name: 'Offer myself as a player' })).toBeInTheDocument();
      expect(screen.getByRole('textbox', { name: 'Note' })).toHaveValue('Bring balls');
    });

    it('does not show an old error when the form is opened again', async () => {
      const user = renderFinder();
      await user.click(screen.getByRole('button', { name: 'Offer a game' }));
      server.failNext = problemResponse('server', 500, 'Something went wrong on our side.');
      await user.click(screen.getByRole('button', { name: 'Post my game' }));
      await screen.findByRole('alert');

      await user.click(screen.getByRole('button', { name: 'Close' }));
      await user.click(screen.getByRole('button', { name: 'Offer a game' }));

      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    it('keeps the form open with everything typed and shows the error when posting fails', async () => {
      const user = renderFinder();
      await user.click(screen.getByRole('button', { name: 'Offer a game' }));
      await user.type(screen.getByRole('textbox', { name: 'Note' }), 'Bring balls');
      server.failNext = problemResponse('server', 500, 'Something went wrong on our side.');

      await user.click(screen.getByRole('button', { name: 'Post my game' }));

      expect(await screen.findByRole('alert')).toHaveTextContent(
        'Something went wrong on our side.',
      );
      expect(screen.getByRole('dialog', { name: 'Offer myself as a player' })).toBeInTheDocument();
      expect(screen.getByRole('textbox', { name: 'Note' })).toHaveValue('Bring balls');
    });

    it('uses the court chosen in the form', async () => {
      const user = renderFinder();

      await user.click(screen.getByRole('button', { name: 'Offer a game' }));
      await user.click(screen.getByRole('button', { name: /Court/ }));
      await user.click(screen.getByRole('option', { name: 'Park Jordana' }));

      expect(screen.getByText(/Singles · NTRP 3\.5 · Park Jordana/)).toBeInTheDocument();
    });
  });

  describe('level quiz', () => {
    async function answerEveryQuestion(
      user: ReturnType<typeof userEvent.setup>,
      option: RegExp,
    ): Promise<void> {
      const dialog = screen.getByRole('dialog');
      for (let step = 0; step < 6; step += 1) {
        await user.click(within(dialog).getAllByRole('button', { name: option })[0] ?? dialog);
      }
    }

    it('opens from the link next to "I play at"', async () => {
      const user = renderFinder();

      await openMoreFilters(user);
      await user.click(screen.getByRole('button', { name: 'Not sure? Take the quiz' }));

      const dialog = screen.getByRole('dialog');
      expect(within(dialog).getByText("What's my level? · 1 of 6")).toBeInTheDocument();
      expect(within(dialog).getByRole('heading', { name: 'How long have you been playing?' }));
      expect(within(dialog).getByRole('progressbar', { name: 'Quiz progress' })).toHaveAttribute(
        'aria-valuenow',
        '0',
      );
    });

    it('opens on arrival when the page asks for it', () => {
      renderFinder('quiz');

      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('goes back one question without losing the earlier answers', async () => {
      const user = renderFinder('quiz');
      const dialog = screen.getByRole('dialog');

      await user.click(within(dialog).getByRole('button', { name: 'Less than 6 months' }));
      expect(within(dialog).getByText("What's my level? · 2 of 6")).toBeInTheDocument();
      await user.click(within(dialog).getByRole('button', { name: 'Back' }));

      expect(within(dialog).getByText("What's my level? · 1 of 6")).toBeInTheDocument();
    });

    it('shows the estimated level and how many players are near it', async () => {
      const user = renderFinder('quiz');

      await answerEveryQuestion(
        user,
        /^(Less than 6 months|I can keep 3 or 4|A soft serve|I rarely come|I avoid it|I have never)/,
      );

      const dialog = screen.getByRole('dialog');
      expect(within(dialog).getByText('Your estimated level')).toBeInTheDocument();
      expect(within(dialog).getByText('2.5')).toBeInTheDocument();
      expect(within(dialog).getByText('1 player')).toBeInTheDocument();
    });

    it('sets "I play at" to the result when you use it', async () => {
      const user = renderFinder('quiz');
      await answerEveryQuestion(
        user,
        /^(Less than 6 months|I can keep 3 or 4|A soft serve|I rarely come|I avoid it|I have never)/,
      );

      await user.click(screen.getByRole('button', { name: 'Use NTRP 2.5' }));

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      await openMoreFilters(user);
      expect(screen.getByRole('button', { name: /I play at/ })).toHaveTextContent('2.5');
    });

    it('starts again from the first question on Retake', async () => {
      const user = renderFinder('quiz');
      await answerEveryQuestion(
        user,
        /^(Less than 6 months|I can keep 3 or 4|A soft serve|I rarely come|I avoid it|I have never)/,
      );

      await user.click(screen.getByRole('button', { name: 'Retake' }));

      expect(screen.getByText("What's my level? · 1 of 6")).toBeInTheDocument();
    });
  });

  describe('dialogs in the address', () => {
    it('puts ?offer=1 in the address when the offer form opens and removes it when it closes', async () => {
      const user = renderFinder();

      await user.click(screen.getByRole('button', { name: 'Offer a game' }));
      expect(navigation.current()).toBe('/players?offer=1');
      expect(screen.getByRole('dialog', { name: 'Offer myself as a player' })).toBeInTheDocument();

      await user.click(screen.getByRole('button', { name: 'Close' }));
      expect(navigation.current()).toBe('/players');
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('closes the form after posting and clears the address', async () => {
      const user = renderFinder('offer');

      await user.click(screen.getByRole('button', { name: 'Post my game' }));

      await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
      expect(navigation.current()).toBe('/players');
    });

    it('opens the form when the address changes to ?offer=1, such as from the header shortcut', () => {
      renderFinder();

      act(() => navigation.setUrl('/players?offer=1'));

      expect(screen.getByRole('dialog', { name: 'Offer myself as a player' })).toBeInTheDocument();
    });

    it('keeps other parameters when a dialog opens and closes', async () => {
      navigation.setUrl('/players?from=home');
      const user = renderFinder();

      await user.click(screen.getByRole('button', { name: 'Offer a game' }));
      expect(navigation.current()).toBe('/players?from=home&offer=1');

      await user.click(screen.getByRole('button', { name: 'Close' }));
      expect(navigation.current()).toBe('/players?from=home');
    });

    it('puts ?quiz=1 in the address while the level quiz is open', async () => {
      const user = renderFinder();
      await user.click(screen.getByRole('button', { name: /More filters/ }));

      await user.click(screen.getByRole('button', { name: 'Not sure? Take the quiz' }));

      expect(navigation.current()).toBe('/players?quiz=1');
    });
  });

  describe('opening a dialog on arrival', () => {
    it('opens the offer form when the page asks for it', () => {
      renderFinder('offer');

      expect(screen.getByRole('dialog', { name: 'Offer myself as a player' })).toBeInTheDocument();
    });
  });

  it('renders the sidebar next to the lists', () => {
    renderFinder();

    expect(screen.getByRole('complementary', { name: 'Side panel' })).toBeInTheDocument();
  });
});
