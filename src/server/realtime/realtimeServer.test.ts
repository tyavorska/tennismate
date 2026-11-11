// @vitest-environment node
import { randomUUID } from 'node:crypto';
import { createServer, type Server as HttpServer } from 'node:http';
import { io as connect, type Socket } from 'socket.io-client';
import { z } from 'zod';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import {
  messageNewEventSchema,
  presenceSnapshotSchema,
  presenceUpdateSchema,
  sendAckSchema,
  type PresenceUpdate,
} from '@/entities/conversation';
import type { User } from '@/entities/user';
import { addDays, todayIn } from '@/shared/lib';
import { db } from '../db';
import { listConversations, sendMessage } from '../conversations';
import { addCity } from '../testing/cities';
import { createPlayer } from '../testing/players';
import { createSessionToken } from '../testing/sessions';
import { createRealtimeServer } from './realtimeServer';

let httpServer: HttpServer;
let url: string;
const open: Socket[] = [];

beforeAll(async () => {
  httpServer = createServer();
  createRealtimeServer(httpServer, { allowedOrigin: 'http://localhost:3000' });
  await new Promise<void>((resolve) => httpServer.listen(0, resolve));
  const address = httpServer.address();
  const port = typeof address === 'object' && address !== null ? address.port : 0;
  url = `http://localhost:${port}`;
});

afterEach(() => {
  for (const socket of open.splice(0)) socket.disconnect();
});

afterAll(async () => {
  await new Promise((resolve) => httpServer.close(resolve));
});

function email(name: string): string {
  return `${name}.${randomUUID().slice(0, 8)}@example.com`;
}

function once<T>(socket: Socket, event: string): Promise<T> {
  return new Promise((resolve) => socket.once(event, resolve));
}

async function connectAs(user: User): Promise<Socket> {
  const socket = connect(url, {
    extraHeaders: { cookie: `session=${createSessionToken(user)}` },
    forceNew: true,
    transports: ['websocket'],
  });
  open.push(socket);
  await once(socket, 'connect');
  return socket;
}

function request(recipient: User, text: string, clientMessageId = randomUUID()) {
  return { recipientId: recipient.id, clientMessageId, text };
}

async function sendAndAwait(socket: Socket, payload: object) {
  return sendAckSchema.parse(await socket.timeout(2000).emitWithAck('message:send', payload));
}

describe('connecting', () => {
  it('refuses a connection without a session', async () => {
    const socket = connect(url, { forceNew: true, transports: ['websocket'] });
    open.push(socket);

    const error = await once<Error>(socket, 'connect_error');

    expect(error.message).toBe('unauthenticated');
  });

  it('refuses a session token that does not exist', async () => {
    const socket = connect(url, {
      extraHeaders: { cookie: 'session=nope' },
      forceNew: true,
      transports: ['websocket'],
    });
    open.push(socket);

    expect((await once<Error>(socket, 'connect_error')).message).toBe('unauthenticated');
  });
});

describe('instant messages', () => {
  it('delivers a message to every open tab of the recipient and acknowledges the sender', async () => {
    const ana = await createPlayer(email('ana'));
    const ben = await createPlayer(email('ben'));
    const anaSocket = await connectAs(ana);
    const benTab1 = await connectAs(ben);
    const benTab2 = await connectAs(ben);
    const arrivals = Promise.all([once(benTab1, 'message:new'), once(benTab2, 'message:new')]);

    const ack = await sendAndAwait(anaSocket, request(ben, 'Saturday at 10?'));
    const [first, second] = (await arrivals).map((event) => messageNewEventSchema.parse(event));

    expect(ack.ok).toBe(true);
    expect(first?.message.text).toBe('Saturday at 10?');
    expect(second?.conversation.partner.id).toBe(ana.id);
    expect(first?.conversation.unreadCount).toBe(1);
  });

  it('shows the sender their own other tabs, but not twice in the sending tab', async () => {
    const ana = await createPlayer(email('ana'));
    const ben = await createPlayer(email('ben'));
    const sending = await connectAs(ana);
    const otherTab = await connectAs(ana);
    const received: string[] = [];
    sending.on('message:new', () => received.push('sending'));
    const mirrored = once(otherTab, 'message:new');

    await sendAndAwait(sending, request(ben, 'Hi'));
    await mirrored;

    expect(received).toEqual([]);
  });

  it('saves a message once when the same client message id is sent again', async () => {
    const ana = await createPlayer(email('ana'));
    const ben = await createPlayer(email('ben'));
    const socket = await connectAs(ana);
    const clientMessageId = randomUUID();

    await sendAndAwait(socket, request(ben, 'Hi', clientMessageId));
    await sendAndAwait(socket, request(ben, 'Hi', clientMessageId));

    expect(listConversations(ben)).toHaveLength(1);
    expect(listConversations(ben)[0]?.unreadCount).toBe(1);
  });

  it('answers a problem, and sends nothing, when the text is empty', async () => {
    const ana = await createPlayer(email('ana'));
    const ben = await createPlayer(email('ben'));
    const socket = await connectAs(ana);

    const ack = await sendAndAwait(socket, request(ben, '   '));

    expect(ack).toMatchObject({ ok: false, problem: { kind: 'validation' } });
    expect(listConversations(ben)).toHaveLength(0);
  });

  it('answers not found for a player in another city', async () => {
    const ana = await createPlayer(email('ana'));
    const city = addCity('gdansk-socket');
    const stranger = await createPlayer(email('stranger'), city.id);
    const socket = await connectAs(ana);

    const ack = await sendAndAwait(socket, request(stranger, 'Hi'));

    expect(ack).toMatchObject({ ok: false, problem: { kind: 'notFound' } });
  });

  it('tells the sender how long to wait when they send too fast', async () => {
    const ana = await createPlayer(email('ana'));
    const ben = await createPlayer(email('ben'));
    const socket = await connectAs(ana);

    const acks = [];
    for (let sent = 0; sent < 21; sent++)
      acks.push(await sendAndAwait(socket, request(ben, `m${sent}`)));

    expect(acks.slice(0, 20).every((ack) => ack.ok)).toBe(true);
    expect(acks[20]).toMatchObject({
      ok: false,
      problem: { kind: 'rateLimited', retryAfterSeconds: expect.any(Number) },
    });
  });

  it('ignores a send without an acknowledgement callback', async () => {
    const ana = await createPlayer(email('ana'));
    const ben = await createPlayer(email('ben'));
    const socket = await connectAs(ana);

    socket.emit('message:send', request(ben, 'Hi'));
    const ack = await sendAndAwait(socket, request(ben, 'Still working'));

    expect(ack.ok).toBe(true);
    expect(listConversations(ben)[0]?.lastMessage.text).toBe('Still working');
  });
});

describe('game invites', () => {
  const timeZone = 'Europe/Warsaw';

  function courtName(): string {
    const row = db.prepare('SELECT name FROM courts WHERE removed_at IS NULL LIMIT 1').get();
    return z.object({ name: z.string() }).parse(row).name;
  }

  function proposal(recipient: User) {
    return {
      ...request(recipient, "Let's play"),
      invite: {
        court: courtName(),
        date: addDays(todayIn(new Date(), timeZone), 3),
        time: '10:00',
      },
    };
  }

  async function inviteSent() {
    const ana = await createPlayer(email('ana'));
    const ben = await createPlayer(email('ben'));
    const anaSocket = await connectAs(ana);
    const benSocket = await connectAs(ben);
    const arrived = once(benSocket, 'message:new');
    const ack = await sendAndAwait(anaSocket, proposal(ben));
    await arrived;
    return { ana, ben, anaSocket, benSocket, ack };
  }

  it('delivers a pending invite to the other player', async () => {
    const { ack } = await inviteSent();

    expect(ack.ok && ack.event.message.invite?.status).toBe('pending');
  });

  it('tells both players when the invite is accepted, with the reply, and plans the game', async () => {
    const { ana, benSocket, anaSocket, ack } = await inviteSent();
    const inviteId = ack.ok ? ack.event.message.invite?.id : undefined;
    const updated = once(anaSocket, 'invite:updated');
    const reply = once(anaSocket, 'message:new');

    const answer = sendAckSchema.parse(
      await benSocket.timeout(2000).emitWithAck('invite:respond', { inviteId, action: 'accept' }),
    );

    const seenByAna = messageNewEventSchema.parse(await updated);
    expect(answer.ok && answer.event.message.invite?.status).toBe('accepted');
    expect(seenByAna.message.invite?.status).toBe('accepted');
    expect(seenByAna.conversation.plan).toBeDefined();
    expect(messageNewEventSchema.parse(await reply).message.text).toContain('Accepted');
    expect(listConversations(ana)[0]?.plan).toBeDefined();
  });

  it('refuses an answer from the proposer', async () => {
    const { anaSocket, ack } = await inviteSent();
    const inviteId = ack.ok ? ack.event.message.invite?.id : undefined;

    const answer = sendAckSchema.parse(
      await anaSocket.timeout(2000).emitWithAck('invite:respond', { inviteId, action: 'accept' }),
    );

    expect(answer).toMatchObject({ ok: false, problem: { kind: 'forbidden' } });
  });

  it('answers a problem for an answer that is not an invite answer', async () => {
    const { benSocket } = await inviteSent();

    const answer = sendAckSchema.parse(
      await benSocket
        .timeout(2000)
        .emitWithAck('invite:respond', { inviteId: 'nope', action: 'accept' }),
    );

    expect(answer).toMatchObject({ ok: false, problem: { kind: 'validation' } });
  });
});

describe('online status', () => {
  it('tells a player who of their conversation partners is online when they connect', async () => {
    const ana = await createPlayer(email('ana'));
    const ben = await createPlayer(email('ben'));
    const cleo = await createPlayer(email('cleo'));
    sendMessage(ana, request(ben, 'Hi'));
    sendMessage(ana, request(cleo, 'Hi'));
    await connectAs(ben);

    const socket = connect(url, {
      extraHeaders: { cookie: `session=${createSessionToken(ana)}` },
      forceNew: true,
      transports: ['websocket'],
    });
    open.push(socket);
    const snapshot = presenceSnapshotSchema.parse(await once(socket, 'presence:snapshot'));

    expect(snapshot.onlineIds).toEqual([ben.id]);
  });

  it('tells partners when a player comes online and goes offline, once for two tabs', async () => {
    const ana = await createPlayer(email('ana'));
    const ben = await createPlayer(email('ben'));
    sendMessage(ana, request(ben, 'Hi'));
    const watcher = await connectAs(ana);
    const updates: PresenceUpdate[] = [];
    watcher.on('presence:update', (update) => updates.push(presenceUpdateSchema.parse(update)));

    const tab1 = await connectAs(ben);
    const tab2 = await connectAs(ben);
    tab1.disconnect();
    await new Promise((resolve) => setTimeout(resolve, 100));
    expect(updates).toEqual([{ userId: ben.id, online: true }]);

    tab2.disconnect();
    await new Promise((resolve) => setTimeout(resolve, 100));
    expect(updates).toEqual([
      { userId: ben.id, online: true },
      { userId: ben.id, online: false },
    ]);
  });

  it('does not tell strangers', async () => {
    const ana = await createPlayer(email('ana'));
    const stranger = await createPlayer(email('stranger'));
    const watcher = await connectAs(stranger);
    const updates: z.core.util.JSONType[] = [];
    watcher.on('presence:update', (update) => updates.push(update));

    await connectAs(ana);
    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(updates).toEqual([]);
  });
});
