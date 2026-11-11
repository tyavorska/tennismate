import 'server-only';
import { randomUUID } from 'node:crypto';
import type { StatementSync } from 'node:sqlite';
import { z } from 'zod';
import {
  conversationSchema,
  messageSchema,
  type Conversation,
  type InviteResponseRequest,
  type Message,
  type MessageNewEvent,
  type NewInvite,
  type SendMessageRequest,
} from '@/entities/conversation';
import { formatRating, initialsOf } from '@/entities/player';
import type { User } from '@/entities/user';
import { addDays, isoDateSchema, toWallClock, todayIn, zonedToUtc } from '@/shared/lib';
import { db } from '../db';
import { transaction } from '../db/transaction';
import { insertAgreedGame } from '../games';
import { DomainError } from '../http';
import { requireProfile } from '../profiles';

const threadPageSize = 50;
const catchUpLimit = 200;
const maxInviteDays = 60;
const acceptedReply = 'Accepted! See you on court 🎾';

const messageRowSchema = z.object({
  id: z.string(),
  conversation_id: z.string(),
  sender_id: z.string(),
  client_message_id: z.string(),
  body: z.string(),
  created_at: z.string(),
  invite_id: z.string().nullable(),
  invite_status: z.string().nullable(),
  invite_proposer_id: z.string().nullable(),
  invite_court: z.string().nullable(),
  invite_starts_at: z.string().nullable(),
});
type MessageRow = z.infer<typeof messageRowSchema>;

// A message with its invite, when it is one. `$now` turns a pending invite in the past into expired.
const selectMessages = `
  SELECT messages.id, messages.conversation_id, messages.sender_id, messages.client_message_id,
         messages.body, messages.created_at, messages.rowid AS position,
         game_invites.id AS invite_id, game_invites.proposer_id AS invite_proposer_id,
         game_invites.starts_at AS invite_starts_at, courts.name AS invite_court,
         CASE WHEN game_invites.status = 'pending' AND game_invites.starts_at <= $now
              THEN 'expired' ELSE game_invites.status END AS invite_status
  FROM messages
  LEFT JOIN game_invites ON game_invites.message_id = messages.id
  LEFT JOIN courts ON courts.id = game_invites.court_id`;

function toMessage(row: MessageRow, timeZone: string): Message {
  const invite = row.invite_id === null ? undefined : toInviteFields(row, timeZone);
  return messageSchema.parse({
    id: row.id,
    conversationId: row.conversation_id,
    senderId: row.sender_id,
    clientMessageId: row.client_message_id,
    text: row.body,
    invite,
    sentAt: row.created_at,
  });
}

function toInviteFields(row: MessageRow, timeZone: string): z.core.util.JSONType {
  const startsAt = z.string().parse(row.invite_starts_at);
  const { date, time } = toWallClock(new Date(startsAt), timeZone);
  return {
    id: row.invite_id,
    status: row.invite_status,
    proposerId: row.invite_proposer_id,
    court: row.invite_court,
    date,
    time,
    startsAt,
  };
}

const summaryRowSchema = messageRowSchema.extend({
  partner_id: z.string(),
  partner_name: z.string(),
  partner_rating: z.number(),
  partner_district: z.string(),
  timezone: z.string(),
  plan_court: z.string().nullable(),
  plan_starts_at: z.string().nullable(),
  unread_count: z.number(),
});

// A conversation with someone outside the viewer's city looks the same as one that does not exist.
const summarySelect = `
  SELECT conversations.id AS conversation_id, partner.user_id AS partner_id,
         partner.name AS partner_name, partner.rating AS partner_rating,
         districts.name AS partner_district, cities.timezone AS timezone,
         last.id, last.sender_id, last.client_message_id, last.body, last.created_at,
         last.invite_id, last.invite_status, last.invite_proposer_id, last.invite_court,
         last.invite_starts_at,
         (SELECT courts.name FROM game_invites AS next_plan
          JOIN courts ON courts.id = next_plan.court_id
          WHERE next_plan.conversation_id = conversations.id AND next_plan.status = 'accepted'
            AND next_plan.starts_at > $now ORDER BY next_plan.starts_at LIMIT 1) AS plan_court,
         (SELECT next_plan.starts_at FROM game_invites AS next_plan
          WHERE next_plan.conversation_id = conversations.id AND next_plan.status = 'accepted'
            AND next_plan.starts_at > $now ORDER BY next_plan.starts_at LIMIT 1) AS plan_starts_at,
         (SELECT COUNT(*) FROM messages AS unread
          WHERE unread.conversation_id = conversations.id AND unread.sender_id != $viewer
            AND (read_up_to.id IS NULL OR unread.rowid > read_up_to.rowid))
           AS unread_count
  FROM conversations
  JOIN profiles AS partner
    ON partner.user_id = CASE WHEN conversations.user_a = $viewer
                              THEN conversations.user_b ELSE conversations.user_a END
  JOIN profiles AS viewer_profile ON viewer_profile.user_id = $viewer
  JOIN cities ON cities.id = viewer_profile.city_id
  JOIN districts ON districts.id = partner.district_id
  JOIN conversation_members AS member
    ON member.conversation_id = conversations.id AND member.user_id = $viewer
  LEFT JOIN messages AS read_up_to ON read_up_to.id = member.last_read_message_id
  JOIN (${selectMessages}) AS last ON last.id = (
    SELECT id FROM messages WHERE conversation_id = conversations.id
    ORDER BY rowid DESC LIMIT 1)
  WHERE (conversations.user_a = $viewer OR conversations.user_b = $viewer)
    AND partner.city_id = viewer_profile.city_id`;

function toConversation(row: z.infer<typeof summaryRowSchema>): Conversation {
  const plan =
    row.plan_court === null || row.plan_starts_at === null
      ? undefined
      : { court: row.plan_court, ...toWallClock(new Date(row.plan_starts_at), row.timezone) };
  return conversationSchema.parse({
    id: row.conversation_id,
    partner: {
      id: row.partner_id,
      name: row.partner_name,
      initials: initialsOf(row.partner_name),
      subtitle: `NTRP ${formatRating(row.partner_rating)} · ${row.partner_district}`,
    },
    lastMessage: toMessage(row, row.timezone),
    plan,
    unreadCount: row.unread_count,
  });
}

function findConversation(
  viewerId: string,
  conversationId: string,
  now: Date,
): Conversation | undefined {
  const row = db
    .prepare(`${summarySelect} AND conversations.id = $id`)
    .get({ viewer: viewerId, id: conversationId, now: now.toISOString() });
  return row && toConversation(summaryRowSchema.parse(row));
}

function requireConversation(user: User, conversationId: string, now: Date): Conversation {
  const conversation = findConversation(user.id, conversationId, now);
  if (conversation === undefined) {
    throw new DomainError('notFound', { message: 'This conversation no longer exists.' });
  }
  return conversation;
}

/** The viewer's conversations in their city, the most recent first. */
export function listConversations(user: User, now: Date = new Date()): readonly Conversation[] {
  requireProfile(user);
  const rows = db
    .prepare(`${summarySelect} ORDER BY last.position DESC`)
    .all({ viewer: user.id, now: now.toISOString() });
  return z.array(summaryRowSchema).parse(rows).map(toConversation);
}

type MessagePage = Readonly<{ after?: string }>;

/** The latest messages oldest first, or those after the message `after`, for catching up. */
export function listMessages(
  user: User,
  conversationId: string,
  { after }: MessagePage = {},
  now: Date = new Date(),
): readonly Message[] {
  const { city } = requireProfile(user);
  requireConversation(user, conversationId, now);
  const parse = (rows: ReturnType<StatementSync['all']>): readonly Message[] =>
    z
      .array(messageRowSchema)
      .parse(rows)
      .map((row) => toMessage(row, city.timezone));

  if (after === undefined) {
    const latest = db
      .prepare(
        `${selectMessages} WHERE messages.conversation_id = $conversation
         ORDER BY messages.rowid DESC LIMIT $limit`,
      )
      .all({ conversation: conversationId, limit: threadPageSize, now: now.toISOString() });
    return parse(latest).toReversed();
  }

  const cursor = db
    .prepare('SELECT rowid AS position FROM messages WHERE id = ? AND conversation_id = ?')
    .get(after, conversationId);
  if (cursor === undefined) {
    throw new DomainError('notFound', { message: 'This message no longer exists.' });
  }
  const { position } = z.object({ position: z.number() }).parse(cursor);

  const newer = db
    .prepare(
      `${selectMessages} WHERE messages.conversation_id = $conversation AND messages.rowid > $position
       ORDER BY messages.rowid LIMIT $limit`,
    )
    .all({
      conversation: conversationId,
      position,
      limit: catchUpLimit,
      now: now.toISOString(),
    });
  return parse(newer);
}

/** Marks everything in the conversation as read. Repeating it changes nothing. */
export function markRead(user: User, conversationId: string): void {
  requireConversation(user, conversationId, new Date());
  db.prepare(
    `UPDATE conversation_members
     SET last_read_message_id = (
       SELECT id FROM messages WHERE conversation_id = $conversation
       ORDER BY rowid DESC LIMIT 1)
     WHERE conversation_id = $conversation AND user_id = $user`,
  ).run({ conversation: conversationId, user: user.id });
}

/** What to send to each player after a change. Each sees the conversation their own way. */
export type MessageChange = Readonly<{ forAuthor: MessageNewEvent; forOther: MessageNewEvent }>;

export type SentMessage = MessageChange & Readonly<{ recipientId: string }>;

export type InviteResponse = Readonly<{
  /** The other player in the conversation. */
  otherId: string;
  /** The invite message with its new status. */
  updated: MessageChange;
  /** The reply written on accepting, if there was one. */
  reply?: MessageChange;
}>;

function findOrCreateConversation(userId: string, recipientId: string, now: Date): string {
  const [userA, userB] = [userId, recipientId].toSorted();
  const existing = db
    .prepare('SELECT id FROM conversations WHERE user_a = ? AND user_b = ?')
    .get(userA, userB);
  if (existing !== undefined) return z.object({ id: z.string() }).parse(existing).id;

  const id = randomUUID();
  db.prepare('INSERT INTO conversations (id, user_a, user_b, created_at) VALUES (?, ?, ?, ?)').run(
    id,
    userA,
    userB,
    now.toISOString(),
  );
  const addMember = db.prepare(
    'INSERT INTO conversation_members (conversation_id, user_id) VALUES (?, ?)',
  );
  addMember.run(id, userId);
  addMember.run(id, recipientId);
  return id;
}

function insertMessage(
  conversationId: string,
  senderId: string,
  clientMessageId: string,
  text: string,
  now: Date,
): string {
  const id = randomUUID();
  db.prepare(
    `INSERT INTO messages (id, conversation_id, sender_id, client_message_id, body, created_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
  ).run(id, conversationId, senderId, clientMessageId, text, now.toISOString());
  // The author has read their own message.
  db.prepare(
    'UPDATE conversation_members SET last_read_message_id = ? WHERE conversation_id = ? AND user_id = ?',
  ).run(id, conversationId, senderId);
  return id;
}

type CheckedInvite = Readonly<{ courtId: number; startsAt: Date }>;

function checkInvite(
  invite: NewInvite,
  city: Readonly<{ id: number; timezone: string }>,
  now: Date,
): CheckedInvite {
  const court = db
    .prepare('SELECT id FROM courts WHERE city_id = ? AND name = ? AND removed_at IS NULL')
    .get(city.id, invite.court);
  if (court === undefined) {
    throw new DomainError('validation', {
      message: 'Choose a court from the list.',
      fieldErrors: { court: 'Choose a court from the list.' },
    });
  }
  const date = isoDateSchema.safeParse(invite.date);
  const startsAt = date.success ? zonedToUtc(date.data, invite.time, city.timezone) : undefined;
  const today = todayIn(now, city.timezone);
  if (
    date.success === false ||
    startsAt === undefined ||
    Number.isNaN(startsAt.getTime()) ||
    startsAt.getTime() <= now.getTime()
  ) {
    throw new DomainError('validation', {
      message: 'Choose a time that has not passed.',
      fieldErrors: { time: 'Choose a time that has not passed.' },
    });
  }
  if (invite.date > addDays(today, maxInviteDays)) {
    throw new DomainError('validation', {
      message: `Choose a day within the next ${maxInviteDays} days.`,
      fieldErrors: { date: 'Choose a day that is closer.' },
    });
  }
  return { courtId: z.number().parse(court.id), startsAt };
}

function changeFor(
  conversationId: string,
  messageId: string,
  authorId: string,
  otherId: string,
  timeZone: string,
  now: Date,
): MessageChange {
  const event = (viewerId: string): MessageNewEvent => {
    const conversation = findConversation(viewerId, conversationId, now);
    const row = db
      .prepare(`${selectMessages} WHERE messages.id = $id`)
      .get({ id: messageId, now: now.toISOString() });
    if (conversation === undefined || row === undefined) {
      throw new Error('Conversation disappeared during change');
    }
    return { conversation, message: toMessage(messageRowSchema.parse(row), timeZone) };
  };
  return { forAuthor: event(authorId), forOther: event(otherId) };
}

/**
 * Saves a message. The conversation is created with the first one. Sending the same
 * `clientMessageId` again returns the message that was already saved. An invite also saves the
 * court and time it proposes, but creates no game until the other player accepts.
 */
export function sendMessage(
  user: User,
  { recipientId, clientMessageId, text, invite }: SendMessageRequest,
  now: Date = new Date(),
): SentMessage {
  const { city } = requireProfile(user);
  if (recipientId === user.id) {
    throw new DomainError('validation', { message: 'You cannot message yourself.' });
  }
  const recipient = db
    .prepare('SELECT 1 AS found FROM profiles WHERE user_id = ? AND city_id = ?')
    .get(recipientId, city.id);
  if (recipient === undefined) {
    throw new DomainError('notFound', { message: 'This player no longer exists.' });
  }
  const checked = invite === undefined ? undefined : checkInvite(invite, city, now);

  const { conversationId, messageId } = transaction(db, () => {
    const id = findOrCreateConversation(user.id, recipientId, now);
    const repeated = db
      .prepare(
        'SELECT id FROM messages WHERE conversation_id = ? AND sender_id = ? AND client_message_id = ?',
      )
      .get(id, user.id, clientMessageId);
    if (repeated !== undefined) {
      return { conversationId: id, messageId: z.object({ id: z.string() }).parse(repeated).id };
    }

    const savedId = insertMessage(id, user.id, clientMessageId, text, now);
    if (checked !== undefined) {
      db.prepare(
        `INSERT INTO game_invites
           (id, message_id, conversation_id, proposer_id, invitee_id, court_id, starts_at, status, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?)`,
      ).run(
        randomUUID(),
        savedId,
        id,
        user.id,
        recipientId,
        checked.courtId,
        checked.startsAt.toISOString(),
        now.toISOString(),
      );
    }
    return { conversationId: id, messageId: savedId };
  });

  return {
    recipientId,
    ...changeFor(conversationId, messageId, user.id, recipientId, city.timezone, now),
  };
}

const inviteRowSchema = z.object({
  id: z.string(),
  message_id: z.string(),
  conversation_id: z.string(),
  proposer_id: z.string(),
  invitee_id: z.string(),
  court_id: z.number(),
  starts_at: z.string(),
  status: z.string(),
});

const finalStatus = {
  accept: 'accepted',
  decline: 'declined',
  cancel: 'cancelled',
} as const satisfies Record<InviteResponseRequest['action'], string>;

const refusalByStatus: Readonly<Record<string, string>> = {
  accepted: 'This invite was already accepted.',
  declined: 'This invite was declined.',
  cancelled: 'This invite was cancelled.',
};

/**
 * The invitee accepts or declines, the proposer cancels. Accepting creates the game, so it shows in
 * both calendars, and writes a reply. Repeating the same answer changes nothing.
 */
export function respondToInvite(
  user: User,
  { inviteId, action }: InviteResponseRequest,
  now: Date = new Date(),
): InviteResponse {
  const { city } = requireProfile(user);
  const found = db.prepare('SELECT * FROM game_invites WHERE id = ?').get(inviteId);
  const invite = found && inviteRowSchema.parse(found);
  // Looking the conversation up also keeps out strangers and other cities.
  if (
    invite === undefined ||
    findConversation(user.id, invite.conversation_id, now) === undefined
  ) {
    throw new DomainError('notFound', { message: 'This invite no longer exists.' });
  }
  const isProposer = invite.proposer_id === user.id;
  if ((action === 'cancel') !== isProposer) {
    throw new DomainError('forbidden', {
      message:
        action === 'cancel'
          ? 'Only the player who proposed can cancel.'
          : 'Only the invited player can answer.',
    });
  }
  const otherId = isProposer ? invite.invitee_id : invite.proposer_id;

  const reply = transaction(db, (): string | undefined => {
    const current = z
      .object({ status: z.string() })
      .parse(db.prepare('SELECT status FROM game_invites WHERE id = ?').get(inviteId)).status;
    if (current === finalStatus[action]) return undefined;
    if (current !== 'pending') {
      throw new DomainError('conflict', { message: refusalByStatus[current] });
    }
    if (action === 'accept' && new Date(invite.starts_at).getTime() <= now.getTime()) {
      throw new DomainError('conflict', { message: 'The time of this invite has passed.' });
    }

    const gameId =
      action === 'accept'
        ? insertAgreedGame(
            {
              hostId: invite.proposer_id,
              guestId: invite.invitee_id,
              courtId: invite.court_id,
              startsAt: new Date(invite.starts_at),
              rating: proposerRating(invite.proposer_id),
            },
            now,
          )
        : null;
    db.prepare(
      'UPDATE game_invites SET status = ?, game_id = ?, responded_at = ? WHERE id = ?',
    ).run(finalStatus[action], gameId, now.toISOString(), inviteId);

    return action === 'accept'
      ? insertMessage(invite.conversation_id, user.id, randomUUID(), acceptedReply, now)
      : undefined;
  });

  return {
    otherId,
    updated: changeFor(
      invite.conversation_id,
      invite.message_id,
      user.id,
      otherId,
      city.timezone,
      now,
    ),
    reply:
      reply === undefined
        ? undefined
        : changeFor(invite.conversation_id, reply, user.id, otherId, city.timezone, now),
  };
}

function proposerRating(proposerId: string): number {
  const row = db.prepare('SELECT rating FROM profiles WHERE user_id = ?').get(proposerId);
  return z.object({ rating: z.number() }).parse(row).rating;
}

/** Everyone the player has a conversation with in their city. Presence is shared with them only. */
export function listPartnerIds(userId: string): readonly string[] {
  const rows = db
    .prepare(
      `SELECT partner.user_id AS id FROM conversations
       JOIN profiles AS partner
         ON partner.user_id = CASE WHEN conversations.user_a = $user
                                   THEN conversations.user_b ELSE conversations.user_a END
       JOIN profiles AS own ON own.user_id = $user
       WHERE (conversations.user_a = $user OR conversations.user_b = $user)
         AND partner.city_id = own.city_id`,
    )
    .all({ user: userId });
  return z
    .array(z.object({ id: z.string() }))
    .parse(rows)
    .map((row) => row.id);
}
