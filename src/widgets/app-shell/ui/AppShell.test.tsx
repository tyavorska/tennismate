import { act, screen, waitFor, within } from '@testing-library/react';
import type { QueryClient } from '@tanstack/react-query';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { type z } from 'zod';
import { playerSchema } from '@/entities/player';
import {
  applyMessageNew,
  conversationQueries,
  registerConversationMutations,
  conversationSchema,
  inviteResponseRequestSchema,
  messageSchema,
  presenceQueries,
  sendAckSchema,
  sendMessageRequestSchema,
  type Conversation,
  type InviteResponseRequest,
  type InviteStatus,
  type Message,
} from '@/entities/conversation';
import { calendarQueries } from '@/entities/game';
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

const playDay = { date: '2026-11-14', time: '10:00', startsAt: '2026-11-14T09:00:00.000Z' };

function inviteMessage(status: InviteStatus, from: 'me' | 'them'): Message {
  return messageSchema.parse({
    ...message(4, 2, from, "Let's play at Park Jordana, Sat 14 Nov · 10:00"),
    invite: {
      id: uuid(7000),
      status,
      proposerId: from === 'me' ? viewerId : uuid(52),
      court: 'Park Jordana',
      ...playDay,
    },
  });
}

const piotrInvite = inviteMessage('pending', 'them');
const piotr = conversation(2, 'Piotr W.', piotrInvite, 0);
const courts = [
  { name: 'Kazimierz Clay Club', district: 'Kazimierz' },
  { name: 'Park Jordana', district: 'Krowodrza' },
];

let markedRead: string[] = [];
let failingUrls: string[] = [];
const requestId = '3f9c2a71-5d0e-4b8a-9c11-0a2b3c4d5e6f';
const onSend = vi.fn();

function installFakeApi(): void {
  vi.stubGlobal(
    'fetch',
    vi.fn((input: string, init?: { method?: string }) => {
      const json = (body: z.core.util.JSONType): Response => new Response(JSON.stringify(body));
      if (failingUrls.includes(input)) {
        return Promise.resolve(
          new Response(JSON.stringify({ kind: 'server', requestId }), { status: 500 }),
        );
      }
      if (input === '/api/conversations') return Promise.resolve(json([ola, piotr]));
      if (init?.method === 'PUT') {
        markedRead.push(input);
        return Promise.resolve(new Response(null, { status: 204 }));
      }
      if (input === `/api/conversations/${ola.id}/messages`)
        return Promise.resolve(json(olaMessages));
      if (input === `/api/conversations/${piotr.id}/messages`)
        return Promise.resolve(json([piotrInvite]));
      if (input === '/api/courts') return Promise.resolve(json(courts));
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

const sentInviteId = uuid(7100);

const statusByAction = {
  accept: 'accepted',
  decline: 'declined',
  cancel: 'cancelled',
} as const satisfies Record<InviteResponseRequest['action'], InviteStatus>;

function ack(
  conversationOf: Conversation,
  saved: Message,
  plan?: Conversation['plan'],
): z.core.util.JSONType {
  const updated = { ...conversationOf, lastMessage: saved, plan, unreadCount: 0 };
  return sendAckSchema.parse({ ok: true, event: { conversation: updated, message: saved } });
}

/** The server's answer to a send, or to an answer to an invite. */
function accepted(payload: z.core.util.JSONType): z.core.util.JSONType {
  const answer = inviteResponseRequestSchema.safeParse(payload);
  if (answer.success) {
    const { action, inviteId } = answer.data;
    const status = statusByAction[action];
    if (inviteId === sentInviteId) {
      return ack(ola, messageWithInvite(ola, 'me', status));
    }
    const plan = action === 'accept' ? { court: 'Park Jordana', ...playDay } : undefined;
    return ack(piotr, inviteMessage(status, 'them'), plan);
  }

  const { recipientId, clientMessageId, text, invite } = sendMessageRequestSchema.parse(payload);
  const target = recipientId === ola.partner.id ? ola : piotr;
  const saved = messageSchema.parse({
    id: uuid(9000),
    conversationId: target.id,
    senderId: viewerId,
    clientMessageId,
    text,
    invite:
      invite === undefined
        ? undefined
        : {
            id: sentInviteId,
            status: 'pending',
            proposerId: viewerId,
            court: invite.court,
            date: invite.date,
            time: invite.time,
            startsAt: `${invite.date}T09:00:00.000Z`,
          },
    sentAt: '2026-11-04T09:30:00.000Z',
  });
  return ack(target, saved);
}

function messageWithInvite(
  target: Conversation,
  from: 'me' | 'them',
  status: InviteStatus,
): Message {
  return messageSchema.parse({
    id: uuid(9000),
    conversationId: target.id,
    senderId: from === 'me' ? viewerId : target.partner.id,
    clientMessageId: uuid(9001),
    text: 'Play?',
    invite: {
      id: sentInviteId,
      status,
      proposerId: viewerId,
      court: 'Kazimierz Clay Club',
      ...playDay,
    },
    sentAt: '2026-11-04T09:30:00.000Z',
  });
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
  failingUrls = [];
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
        expect.any(Function),
      );
    });

    describe('game invites', () => {
      async function openThread(name: RegExp): Promise<ReturnType<typeof userEvent.setup>> {
        const user = userEvent.setup();
        await user.click(await screen.findByRole('button', { name: /Messages/ }));
        await user.click(await screen.findByRole('button', { name: name }));
        return user;
      }

      it('proposes a court and time, and waits for the other player to answer', async () => {
        onSend.mockImplementation((payload, acknowledge) => acknowledge(accepted(payload)));
        renderShell();
        const user = await openThread(/Ola N\./);
        await screen.findByText('Are we still on for Saturday?');
        expect(screen.getByText('No court booked yet')).toBeInTheDocument();

        await user.click(screen.getByRole('button', { name: 'Propose a court' }));
        await user.click(await screen.findByRole('button', { name: /Send "let's play" invite/ }));

        const card = await screen.findByRole('article', { name: "Let's play invite" });
        expect(within(card).getByText('Waiting for Ola')).toBeInTheDocument();
        expect(within(card).getByText('Kazimierz Clay Club')).toBeInTheDocument();
        expect(screen.getByText('No court booked yet')).toBeInTheDocument();
        expect(onSend).toHaveBeenCalledWith(
          expect.objectContaining({
            invite: {
              court: 'Kazimierz Clay Club',
              date: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
              time: '10:00',
            },
          }),
          expect.any(Function),
          expect.any(Function),
        );
        expect(screen.queryByRole('form', { name: 'Propose a court' })).not.toBeInTheDocument();
      });

      it('lets the proposer cancel an invite that is waiting', async () => {
        onSend.mockImplementation((payload, acknowledge) => acknowledge(accepted(payload)));
        renderShell();
        const user = await openThread(/Ola N\./);
        await screen.findByText('Are we still on for Saturday?');
        await user.click(screen.getByRole('button', { name: 'Propose a court' }));
        await user.click(await screen.findByRole('button', { name: /Send "let's play" invite/ }));

        await user.click(await screen.findByRole('button', { name: 'Cancel invite' }));

        expect(await screen.findByText('Cancelled')).toBeInTheDocument();
        expect(onSend).toHaveBeenLastCalledWith(
          { inviteId: sentInviteId, action: 'cancel' },
          expect.any(Function),
          expect.any(Function),
        );
      });

      it('shows an invite from the other player with Accept and Decline', async () => {
        renderShell();
        await openThread(/Piotr W\./);

        const card = await screen.findByRole('article', { name: "Let's play invite" });
        expect(within(card).getByText('Sat 14 Nov · 10:00')).toBeInTheDocument();
        expect(within(card).getByText('Park Jordana')).toBeInTheDocument();
        expect(within(card).getByRole('button', { name: 'Accept' })).toBeInTheDocument();
        expect(within(card).getByRole('button', { name: 'Decline' })).toBeInTheDocument();
      });

      it('confirms the game for both, links to the calendar and plans the game', async () => {
        onSend.mockImplementation((payload, acknowledge) => acknowledge(accepted(payload)));
        const client = createTestQueryClient();
        const invalidate = vi.spyOn(client, 'invalidateQueries');
        renderShell(client);
        const user = await openThread(/Piotr W\./);

        await user.click(await screen.findByRole('button', { name: 'Accept' }));

        const card = await screen.findByRole('article', { name: "Let's play invite" });
        expect(within(card).getByText(/Confirmed by both/)).toBeInTheDocument();
        expect(within(card).getByRole('link', { name: 'in your calendar' })).toHaveAttribute(
          'href',
          '/calendar?day=2026-11-14',
        );
        expect(screen.getByText('Sat 14 Nov · 10:00 · Park Jordana')).toBeInTheDocument();
        expect(onSend).toHaveBeenCalledWith(
          { inviteId: piotrInvite.invite?.id, action: 'accept' },
          expect.any(Function),
          expect.any(Function),
        );
        expect(invalidate).toHaveBeenCalledWith(calendarQueries.all());
      });

      it('declines an invite', async () => {
        onSend.mockImplementation((payload, acknowledge) => acknowledge(accepted(payload)));
        renderShell();
        const user = await openThread(/Piotr W\./);

        await user.click(await screen.findByRole('button', { name: 'Decline' }));

        expect(await screen.findByText('Declined')).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'Accept' })).not.toBeInTheDocument();
      });

      it('says so when an invite can no longer be answered, and leaves the card as it was', async () => {
        onSend.mockImplementation((_payload, acknowledge) =>
          acknowledge({
            ok: false,
            problem: { kind: 'conflict', message: 'The time of this invite has passed.' },
          }),
        );
        renderShell();
        const user = await openThread(/Piotr W\./);

        await user.click(await screen.findByRole('button', { name: 'Accept' }));

        expect(await screen.findByRole('alert')).toHaveTextContent(
          'The time of this invite has passed.',
        );
        expect(screen.getByRole('button', { name: 'Accept' })).toBeInTheDocument();
      });

      it('updates the card when the other player answers while it is open', async () => {
        const client = renderShell();
        await openThread(/Ola N\./);
        await screen.findByText('Are we still on for Saturday?');
        const mine = messageWithInvite(ola, 'me', 'pending');
        act(() =>
          applyMessageNew(client, { conversation: { ...ola, lastMessage: mine }, message: mine }),
        );
        expect(await screen.findByText('Waiting for Ola')).toBeInTheDocument();

        const answered = messageWithInvite(ola, 'me', 'accepted');
        act(() =>
          applyMessageNew(client, {
            conversation: {
              ...ola,
              lastMessage: answered,
              plan: { court: 'Kazimierz Clay Club', ...playDay },
            },
            message: answered,
          }),
        );

        expect(await screen.findByText(/Confirmed by both/)).toBeInTheDocument();
        expect(screen.queryByText('Waiting for Ola')).not.toBeInTheDocument();
      });

      it('shows an invite whose time has passed as expired', async () => {
        const client = renderShell();
        await openThread(/Ola N\./);
        await screen.findByText('Are we still on for Saturday?');
        const old = messageWithInvite(ola, 'them', 'expired');

        act(() =>
          applyMessageNew(client, { conversation: { ...ola, lastMessage: old }, message: old }),
        );

        expect(await screen.findByText('Expired')).toBeInTheDocument();
      });
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

    describe('when something fails', () => {
      async function openOla(): Promise<ReturnType<typeof userEvent.setup>> {
        const user = userEvent.setup();
        await user.click(await screen.findByRole('button', { name: 'Messages, 1 unread' }));
        await user.click(await screen.findByRole('button', { name: /Ola N\./ }));
        await screen.findByText('Are we still on for Saturday?');
        await user.type(screen.getByRole('textbox', { name: 'Message' }), 'See you at 10');
        return user;
      }

      async function failedSend(): Promise<void> {
        await userEvent.setup().click(screen.getByRole('button', { name: 'Send' }));
      }

      it('shows an error with a reference, not an empty inbox, when the list cannot load', async () => {
        failingUrls = ['/api/conversations'];
        renderShell();
        const user = userEvent.setup();

        await user.click(screen.getByRole('button', { name: /Messages/ }));

        const drawer = screen.getByRole('dialog', { name: 'Messages' });
        expect(await within(drawer).findByText('Your messages did not load')).toBeInTheDocument();
        expect(within(drawer).getByText(/Something went wrong on our side/)).toBeInTheDocument();
        expect(within(drawer).getByText('Reference: 3f9c2a71')).toBeInTheDocument();
        expect(within(drawer).queryByText(/No messages yet/)).not.toBeInTheDocument();
      });

      it('loads the list when the player presses Try again', async () => {
        failingUrls = ['/api/conversations'];
        renderShell();
        const user = userEvent.setup();
        await user.click(screen.getByRole('button', { name: /Messages/ }));
        await screen.findByText('Your messages did not load');

        failingUrls = [];
        await user.click(screen.getByRole('button', { name: 'Try again' }));

        expect(await screen.findByRole('button', { name: /Ola N\./ })).toBeInTheDocument();
        expect(screen.queryByText('Your messages did not load')).not.toBeInTheDocument();
      });

      it('keeps the conversations and shows a notice when a refresh fails', async () => {
        const client = createTestQueryClient();
        client.setQueryData(conversationQueries.list().queryKey, [ola, piotr]);
        renderShell(client);
        const user = userEvent.setup();
        await user.click(screen.getByRole('button', { name: /Messages/ }));
        failingUrls = ['/api/conversations'];

        await act(() => client.invalidateQueries(conversationQueries.list()));

        const drawer = screen.getByRole('dialog', { name: 'Messages' });
        expect(await within(drawer).findByRole('status')).toHaveTextContent(
          'Something went wrong on our side',
        );
        expect(within(drawer).getByRole('button', { name: /Ola N\./ })).toBeInTheDocument();
      });

      function renderWithRetries(): void {
        const client = createTestQueryClient();
        registerConversationMutations(client, { retryDelay: () => 0 });
        renderShell(client);
      }

      it('tries again on its own after a timeout, with the same id, and shows no error when it works', async () => {
        onSend.mockImplementationOnce((_payload, _acknowledge, timeOut) => timeOut());
        onSend.mockImplementation((payload, acknowledge) => acknowledge(accepted(payload)));
        renderWithRetries();
        await openOla();

        await failedSend();

        expect(await screen.findByText('See you at 10', { selector: 'p' })).toBeInTheDocument();
        expect(onSend).toHaveBeenCalledTimes(2);
        const [first, second] = onSend.mock.calls.map(([payload]) => payload);
        expect(second.clientMessageId).toBe(first.clientMessageId);
        expect(screen.queryByRole('alert')).not.toBeInTheDocument();
      });

      it('tries again after a rate limit', async () => {
        onSend.mockImplementationOnce((_payload, acknowledge) =>
          acknowledge({ ok: false, problem: { kind: 'rateLimited', retryAfterSeconds: 3 } }),
        );
        onSend.mockImplementation((payload, acknowledge) => acknowledge(accepted(payload)));
        renderWithRetries();
        await openOla();

        await failedSend();

        expect(await screen.findByText('See you at 10', { selector: 'p' })).toBeInTheDocument();
        expect(onSend).toHaveBeenCalledTimes(2);
      });

      it('gives up after three attempts, keeps the text and offers to send again', async () => {
        onSend.mockImplementation((_payload, _acknowledge, timeOut) => timeOut());
        renderWithRetries();
        await openOla();

        await failedSend();

        expect(await screen.findByRole('alert')).toHaveTextContent("We couldn't reach the server");
        expect(onSend).toHaveBeenCalledTimes(3);
        expect(screen.getByRole('textbox', { name: 'Message' })).toHaveValue('See you at 10');
        expect(screen.getByRole('button', { name: 'Send' })).toBeEnabled();
      });

      it('does not try again when the problem will not go away by itself', async () => {
        onSend.mockImplementation((_payload, acknowledge) =>
          acknowledge({ ok: false, problem: { kind: 'notFound' } }),
        );
        renderWithRetries();
        await openOla();

        await failedSend();

        expect(await screen.findByRole('alert')).toHaveTextContent('no longer exists');
        expect(onSend).toHaveBeenCalledTimes(1);
      });

      it('says the server could not be reached, and keeps the text, when no answer comes', async () => {
        onSend.mockImplementation((_payload, _acknowledge, timeOut) => timeOut());
        renderShell();
        await openOla();

        await failedSend();

        expect(await screen.findByRole('alert')).toHaveTextContent(
          "We couldn't reach the server. Your changes are still here.",
        );
        expect(screen.getByRole('textbox', { name: 'Message' })).toHaveValue('See you at 10');
      });

      it('keeps the text when the answer is not one the app understands', async () => {
        onSend.mockImplementation((_payload, acknowledge) => acknowledge({ nonsense: true }));
        renderShell();
        await openOla();

        await failedSend();

        expect(await screen.findByRole('alert')).toHaveTextContent('We received unexpected data.');
        expect(screen.getByRole('textbox', { name: 'Message' })).toHaveValue('See you at 10');
      });

      it('says to slow down, and keeps the text, when sending is rate limited', async () => {
        onSend.mockImplementation((_payload, acknowledge) =>
          acknowledge({ ok: false, problem: { kind: 'rateLimited' } }),
        );
        renderShell();
        await openOla();

        await failedSend();

        expect(await screen.findByRole('alert')).toHaveTextContent('Too many requests.');
        expect(screen.getByRole('textbox', { name: 'Message' })).toHaveValue('See you at 10');
      });

      it('shows the reference of a server failure so it can be found in the logs', async () => {
        onSend.mockImplementation((_payload, acknowledge) =>
          acknowledge({ ok: false, problem: { kind: 'server', requestId } }),
        );
        renderShell();
        await openOla();

        await failedSend();

        expect(await screen.findByRole('alert')).toHaveTextContent('Reference: 3f9c2a71');
      });

      it('sends one message when Send is pressed twice while the first is waiting', async () => {
        onSend.mockImplementation(() => undefined);
        renderShell();
        const user = await openOla();

        await user.click(screen.getByRole('button', { name: 'Send' }));
        await user.click(screen.getByRole('button', { name: 'Send' }));

        expect(onSend).toHaveBeenCalledTimes(1);
        expect(screen.getByRole('button', { name: 'Send' })).toBeDisabled();
      });
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
