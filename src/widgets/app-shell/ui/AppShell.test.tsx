import { act, screen, waitFor, within } from '@testing-library/react';
import type { QueryClient } from '@tanstack/react-query';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import { playerSchema } from '@/entities/player';
import {
  applyMessageNew,
  conversationQueries,
  conversationSchema,
  inviteSchema,
  messageSchema,
  presenceQueries,
  sendAckSchema,
  type Conversation,
  type Message,
} from '@/entities/conversation';
import {
  createTestQueryClient,
  createTestSocket,
  renderWithQuery,
  TestRealtime,
} from '@/shared/testing';
import { AppShell } from '../index';

const router = vi.hoisted(() => ({ replace: vi.fn(), refresh: vi.fn(), push: vi.fn() }));
vi.mock('next/navigation', () => ({ useRouter: () => router, usePathname: () => '/players' }));

const viewer = playerSchema.parse({
  id: '2f1c6c8e-9a43-4b8b-9a55-0f6a7b3a1d10',
  name: 'Tania Ivanova',
  rating: 2,
  neighborhood: 'Stare Miasto',
  city: { id: 1, name: 'Kraków', timezone: 'Europe/Warsaw' },
});

function uuid(n: number): string {
  return `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
}

const viewerId = viewer.id;

function message(n: number, conversationN: number, from: 'me' | 'them', text: string): Message {
  return messageSchema.parse({
    id: uuid(1000 + n),
    conversationId: uuid(conversationN),
    senderId: from === 'me' ? viewerId : uuid(conversationN + 50),
    clientMessageId: uuid(2000 + n),
    text,
    sentAt: `2026-11-04T09:0${n}:00.000Z`,
  });
}

function conversation(n: number, name: string, last: Message, unreadCount: number): Conversation {
  return conversationSchema.parse({
    id: uuid(n),
    partner: {
      id: uuid(n + 50),
      name,
      initials: name.slice(0, 2).toUpperCase(),
      subtitle: 'NTRP 3.0 · Nowa Huta',
    },
    lastMessage: last,
    unreadCount,
  });
}

const olaMessages = [
  message(1, 1, 'them', 'Are we still on for Saturday?'),
  message(2, 1, 'me', 'Yes! 10:00 works.'),
  message(3, 1, 'them', "Perfect. I'll bring new balls."),
];
const ola = conversation(1, 'Ola N.', olaMessages[2] ?? message(3, 1, 'them', ''), 2);
const piotr = conversation(2, 'Piotr W.', message(4, 2, 'them', 'Great match!'), 0);

let markedRead: string[] = [];
const onSend = vi.fn();

function installFakeApi(): void {
  vi.stubGlobal(
    'fetch',
    vi.fn((input: string, init?: { method?: string }) => {
      const json = (body: z.core.util.JSONType): Response => new Response(JSON.stringify(body));
      if (input === '/api/conversations') return Promise.resolve(json([ola, piotr]));
      if (init?.method === 'PUT') {
        markedRead.push(input);
        return Promise.resolve(new Response(null, { status: 204 }));
      }
      if (input === `/api/conversations/${ola.id}/messages`)
        return Promise.resolve(json(olaMessages));
      return Promise.resolve(new Response(null, { status: 404 }));
    }),
  );
}

function renderShell(client: QueryClient = createTestQueryClient()): QueryClient {
  renderWithQuery(
    <TestRealtime socket={createTestSocket({ onSend })}>
      <AppShell viewer={viewer}>
        <p>Page content</p>
      </AppShell>
    </TestRealtime>,
    client,
  );
  return client;
}

/** The server's reply to a send: the message saved, in the conversation with the recipient. */
function accepted(payload: z.core.util.JSONType): z.core.util.JSONType {
  const { recipientId, clientMessageId, text, invite } = z
    .object({
      recipientId: z.string(),
      clientMessageId: z.string(),
      text: z.string(),
      invite: inviteSchema.optional(),
    })
    .parse(payload);
  const saved = messageSchema.parse({
    id: uuid(9000),
    conversationId: ola.id,
    senderId: viewerId,
    clientMessageId,
    text,
    invite,
    sentAt: '2026-11-04T09:30:00.000Z',
  });
  const updated = {
    ...(recipientId === ola.partner.id ? ola : piotr),
    lastMessage: saved,
    plan: invite,
    unreadCount: 0,
  };
  return sendAckSchema.parse({ ok: true, event: { conversation: updated, message: saved } });
}

async function openAccountMenu(): Promise<ReturnType<typeof userEvent.setup>> {
  const user = userEvent.setup();
  await user.click(screen.getByRole('button', { name: /Tania/ }));
  return user;
}

beforeEach(() => {
  router.replace.mockReset();
  router.refresh.mockReset();
  markedRead = [];
  onSend.mockReset();
  installFakeApi();
});

afterEach(() => vi.unstubAllGlobals());

describe('AppShell', () => {
  it('credits OpenStreetMap for the court data', () => {
    renderShell();

    expect(screen.getByRole('link', { name: 'OpenStreetMap contributors' })).toHaveAttribute(
      'href',
      'https://www.openstreetmap.org/copyright',
    );
    expect(screen.getByRole('link', { name: 'GeoNames' })).toHaveAttribute(
      'href',
      'https://www.geonames.org/',
    );
  });

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
    it('shows the number of unread conversations on the Messages button', async () => {
      renderShell();

      expect(await screen.findByRole('button', { name: 'Messages, 1 unread' })).toBeInTheDocument();
    });

    it('lists the conversations in a drawer with the latest message of each', async () => {
      renderShell();
      const user = userEvent.setup();
      await screen.findByRole('button', { name: 'Messages, 1 unread' });

      await user.click(screen.getByRole('button', { name: /Messages/ }));

      const drawer = screen.getByRole('dialog', { name: 'Messages' });
      expect(await within(drawer).findAllByRole('listitem')).toHaveLength(2);
      expect(within(drawer).getByText("Perfect. I'll bring new balls.")).toBeInTheDocument();
    });

    it('says so when there are no conversations yet', async () => {
      const client = createTestQueryClient();
      client.setQueryData(conversationQueries.list().queryKey, []);
      renderShell(client);
      const user = userEvent.setup();

      await user.click(screen.getByRole('button', { name: /Messages/ }));

      expect(within(screen.getByRole('dialog')).getByText(/No messages yet/)).toBeInTheDocument();
    });

    it('opens a conversation, shows its messages and marks it read', async () => {
      renderShell();
      const user = userEvent.setup();
      await user.click(await screen.findByRole('button', { name: 'Messages, 1 unread' }));

      await user.click(await screen.findByRole('button', { name: /Ola N\./ }));

      expect(await screen.findByText('Are we still on for Saturday?')).toBeInTheDocument();
      await waitFor(() => expect(markedRead).toEqual([`/api/conversations/${ola.id}/read`]));
      await user.click(screen.getByRole('button', { name: 'Back to messages' }));
      await user.click(screen.getByRole('button', { name: 'Close' }));
      expect(screen.getByRole('button', { name: 'Messages' })).toBeInTheDocument();
    });

    it('sends a reply, shows it in the thread and clears the box', async () => {
      onSend.mockImplementation((payload, acknowledge) => acknowledge(accepted(payload)));
      renderShell();
      const user = userEvent.setup();
      await user.click(await screen.findByRole('button', { name: 'Messages, 1 unread' }));
      await user.click(await screen.findByRole('button', { name: /Ola N\./ }));
      await screen.findByText('Are we still on for Saturday?');

      await user.type(screen.getByRole('textbox', { name: 'Message' }), 'See you at 10');
      await user.click(screen.getByRole('button', { name: 'Send' }));

      expect(await screen.findByText('See you at 10')).toBeInTheDocument();
      expect(screen.getByRole('textbox', { name: 'Message' })).toHaveValue('');
      expect(onSend).toHaveBeenCalledWith(
        expect.objectContaining({ recipientId: ola.partner.id, text: 'See you at 10' }),
        expect.any(Function),
      );
    });

    it('shows no plan until an invite is sent, then shows the proposed court and time', async () => {
      onSend.mockImplementation((payload, acknowledge) => acknowledge(accepted(payload)));
      renderShell();
      const user = userEvent.setup();
      await user.click(await screen.findByRole('button', { name: 'Messages, 1 unread' }));
      await user.click(await screen.findByRole('button', { name: /Ola N\./ }));
      await screen.findByText('Are we still on for Saturday?');
      expect(screen.getByText('No court booked yet')).toBeInTheDocument();

      await user.click(screen.getByRole('button', { name: 'Propose a court' }));
      await user.click(screen.getByRole('button', { name: /Send "let's play" invite/ }));

      expect(await screen.findByText('Tomorrow 10:00 · Kazimierz Clay Club')).toBeInTheDocument();
      expect(onSend).toHaveBeenCalledWith(
        expect.objectContaining({
          invite: { court: 'Kazimierz Clay Club', slot: 'Tomorrow 10:00' },
        }),
        expect.any(Function),
      );
      expect(screen.queryByRole('form', { name: 'Propose a court' })).not.toBeInTheDocument();
    });

    it('sends a quick reply', async () => {
      onSend.mockImplementation((payload, acknowledge) => acknowledge(accepted(payload)));
      renderShell();
      const user = userEvent.setup();
      await user.click(await screen.findByRole('button', { name: 'Messages, 1 unread' }));
      await user.click(await screen.findByRole('button', { name: /Ola N\./ }));
      await screen.findByText('Are we still on for Saturday?');

      await user.click(screen.getByRole('button', { name: 'Sounds good' }));

      expect(await screen.findByText('Sounds good', { selector: 'p' })).toBeInTheDocument();
    });

    it('keeps the text and says what went wrong when a message cannot be sent', async () => {
      onSend.mockImplementation((_payload, acknowledge) =>
        acknowledge({ ok: false, problem: { kind: 'unavailable' } }),
      );
      renderShell();
      const user = userEvent.setup();
      await user.click(await screen.findByRole('button', { name: 'Messages, 1 unread' }));
      await user.click(await screen.findByRole('button', { name: /Ola N\./ }));
      await screen.findByText('Are we still on for Saturday?');

      await user.type(screen.getByRole('textbox', { name: 'Message' }), 'See you at 10');
      await user.click(screen.getByRole('button', { name: 'Send' }));

      expect(await screen.findByRole('alert')).toHaveTextContent('temporarily unavailable');
      expect(screen.getByRole('textbox', { name: 'Message' })).toHaveValue('See you at 10');
    });

    it('sends the same client message id again when a failed message is repeated', async () => {
      onSend.mockImplementationOnce((_payload, acknowledge) =>
        acknowledge({ ok: false, problem: { kind: 'unavailable' } }),
      );
      onSend.mockImplementation((payload, acknowledge) => acknowledge(accepted(payload)));
      renderShell();
      const user = userEvent.setup();
      await user.click(await screen.findByRole('button', { name: 'Messages, 1 unread' }));
      await user.click(await screen.findByRole('button', { name: /Ola N\./ }));
      await screen.findByText('Are we still on for Saturday?');
      await user.type(screen.getByRole('textbox', { name: 'Message' }), 'See you at 10');

      await user.click(screen.getByRole('button', { name: 'Send' }));
      await screen.findByRole('alert');
      await user.click(screen.getByRole('button', { name: 'Send' }));

      await waitFor(() => expect(onSend).toHaveBeenCalledTimes(2));
      const [first, second] = onSend.mock.calls.map(([payload]) => payload);
      expect(second.clientMessageId).toBe(first.clientMessageId);
    });

    it('shows a message the moment it arrives in the open conversation', async () => {
      const client = renderShell();
      const user = userEvent.setup();
      await user.click(await screen.findByRole('button', { name: 'Messages, 1 unread' }));
      await user.click(await screen.findByRole('button', { name: /Ola N\./ }));
      await screen.findByText('Are we still on for Saturday?');

      const arrived = message(7, 1, 'them', 'Running 5 minutes late');
      act(() =>
        applyMessageNew(client, {
          conversation: { ...ola, lastMessage: arrived, unreadCount: 1 },
          message: arrived,
        }),
      );

      expect(await screen.findByText('Running 5 minutes late')).toBeInTheDocument();
    });

    it('shows who is online', async () => {
      const client = createTestQueryClient();
      client.setQueryData(presenceQueries.online().queryKey, [ola.partner.id]);
      renderShell(client);
      const user = userEvent.setup();
      await user.click(await screen.findByRole('button', { name: 'Messages, 1 unread' }));

      await user.click(await screen.findByRole('button', { name: /Ola N\./ }));

      expect(await screen.findByText(/· Online/)).toBeInTheDocument();
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
