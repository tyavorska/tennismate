import 'server-only';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import {
  conversationSchema,
  messageSchema,
  type Conversation,
  type Message,
  type MessageNewEvent,
  type SendMessageRequest,
} from '@/entities/conversation';
import { formatRating, initialsOf } from '@/entities/player';
import type { User } from '@/entities/user';
import { db } from '../db';
import { transaction } from '../db/transaction';
import { DomainError } from '../http';
import { requireProfile } from '../profiles';

const threadPageSize = 50;
const catchUpLimit = 200;

const messageRowSchema = z.object({
  id: z.string(),
  conversation_id: z.string(),
  sender_id: z.string(),
  client_message_id: z.string(),
  body: z.string(),
  invite_court: z.string().nullable(),
  invite_slot: z.string().nullable(),
  created_at: z.string(),
});

function toMessage(row: z.infer<typeof messageRowSchema>): Message {
  return messageSchema.parse({
    id: row.id,
    conversationId: row.conversation_id,
    senderId: row.sender_id,
    clientMessageId: row.client_message_id,
    text: row.body,
    invite:
      row.invite_court === null || row.invite_slot === null
        ? undefined
        : { court: row.invite_court, slot: row.invite_slot },
    sentAt: row.created_at,
  });
}

const summaryRowSchema = messageRowSchema.extend({
  partner_id: z.string(),
  partner_name: z.string(),
  partner_rating: z.number(),
  partner_district: z.string(),
  plan_court: z.string().nullable(),
  plan_slot: z.string().nullable(),
  unread_count: z.number(),
});

// A conversation with someone outside the viewer's city looks the same as one that does not exist.
const summarySelect = `
  SELECT conversations.id AS conversation_id, partner.user_id AS partner_id,
         partner.name AS partner_name, partner.rating AS partner_rating,
         districts.name AS partner_district,
         last.id, last.sender_id, last.client_message_id, last.body, last.invite_court,
         last.invite_slot, last.created_at,
         (SELECT invite_court FROM messages WHERE conversation_id = conversations.id
            AND invite_court IS NOT NULL ORDER BY rowid DESC LIMIT 1) AS plan_court,
         (SELECT invite_slot FROM messages WHERE conversation_id = conversations.id
            AND invite_court IS NOT NULL ORDER BY rowid DESC LIMIT 1) AS plan_slot,
         (SELECT COUNT(*) FROM messages AS unread
          WHERE unread.conversation_id = conversations.id AND unread.sender_id != $viewer
            AND (read_up_to.id IS NULL OR unread.rowid > read_up_to.rowid))
           AS unread_count
  FROM conversations
  JOIN profiles AS partner
    ON partner.user_id = CASE WHEN conversations.user_a = $viewer
                              THEN conversations.user_b ELSE conversations.user_a END
  JOIN profiles AS viewer_profile ON viewer_profile.user_id = $viewer
  JOIN districts ON districts.id = partner.district_id
  JOIN conversation_members AS member
    ON member.conversation_id = conversations.id AND member.user_id = $viewer
  LEFT JOIN messages AS read_up_to ON read_up_to.id = member.last_read_message_id
  JOIN messages AS last ON last.id = (
    SELECT id FROM messages WHERE conversation_id = conversations.id
    ORDER BY rowid DESC LIMIT 1)
  WHERE (conversations.user_a = $viewer OR conversations.user_b = $viewer)
    AND partner.city_id = viewer_profile.city_id`;

function toConversation(row: z.infer<typeof summaryRowSchema>): Conversation {
  return conversationSchema.parse({
    id: row.conversation_id,
    partner: {
      id: row.partner_id,
      name: row.partner_name,
      initials: initialsOf(row.partner_name),
      subtitle: `NTRP ${formatRating(row.partner_rating)} · ${row.partner_district}`,
    },
    lastMessage: toMessage(row),
    plan:
      row.plan_court === null || row.plan_slot === null
        ? undefined
        : { court: row.plan_court, slot: row.plan_slot },
    unreadCount: row.unread_count,
  });
}

function findConversation(viewerId: string, conversationId: string): Conversation | undefined {
  const row = db
    .prepare(`${summarySelect} AND conversations.id = $id`)
    .get({ viewer: viewerId, id: conversationId });
  return row && toConversation(summaryRowSchema.parse(row));
}

function requireConversation(user: User, conversationId: string): Conversation {
  const conversation = findConversation(user.id, conversationId);
  if (conversation === undefined) {
    throw new DomainError('notFound', { message: 'This conversation no longer exists.' });
  }
  return conversation;
}

/** The viewer's conversations in their city, the most recent first. */
export function listConversations(user: User): readonly Conversation[] {
  requireProfile(user);
  const rows = db.prepare(`${summarySelect} ORDER BY last.rowid DESC`).all({ viewer: user.id });
  return z.array(summaryRowSchema).parse(rows).map(toConversation);
}

type MessagePage = Readonly<{ after?: string }>;

/** The latest messages oldest first, or those after the message `after`, for catching up. */
export function listMessages(
  user: User,
  conversationId: string,
  { after }: MessagePage = {},
): readonly Message[] {
  requireConversation(user, conversationId);

  if (after === undefined) {
    const latest = db
      .prepare(`SELECT * FROM messages WHERE conversation_id = ? ORDER BY rowid DESC LIMIT ?`)
      .all(conversationId, threadPageSize);
    return z.array(messageRowSchema).parse(latest).map(toMessage).reverse();
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
      `SELECT * FROM messages WHERE conversation_id = ? AND rowid > ? ORDER BY rowid LIMIT ?`,
    )
    .all(conversationId, position, catchUpLimit);
  return z.array(messageRowSchema).parse(newer).map(toMessage);
}

/** Marks everything in the conversation as read. Repeating it changes nothing. */
export function markRead(user: User, conversationId: string): void {
  requireConversation(user, conversationId);
  db.prepare(
    `UPDATE conversation_members
     SET last_read_message_id = (
       SELECT id FROM messages WHERE conversation_id = $conversation
       ORDER BY rowid DESC LIMIT 1)
     WHERE conversation_id = $conversation AND user_id = $user`,
  ).run({ conversation: conversationId, user: user.id });
}

export type SentMessage = Readonly<{
  recipientId: string;
  /** What to send to the author, and to the recipient. Each sees the conversation their own way. */
  forSender: MessageNewEvent;
  forRecipient: MessageNewEvent;
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

/**
 * Saves a message. The conversation is created with the first one. Sending the same
 * `clientMessageId` again returns the message that was already saved.
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

  const conversationId = transaction(db, () => {
    const id = findOrCreateConversation(user.id, recipientId, now);
    const repeated = db
      .prepare(
        'SELECT 1 AS found FROM messages WHERE conversation_id = ? AND sender_id = ? AND client_message_id = ?',
      )
      .get(id, user.id, clientMessageId);
    if (repeated !== undefined) return id;

    const messageId = randomUUID();
    db.prepare(
      `INSERT INTO messages
         (id, conversation_id, sender_id, client_message_id, body, invite_court, invite_slot, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    ).run(
      messageId,
      id,
      user.id,
      clientMessageId,
      text,
      invite?.court ?? null,
      invite?.slot ?? null,
      now.toISOString(),
    );
    // The author has read their own message.
    db.prepare(
      'UPDATE conversation_members SET last_read_message_id = ? WHERE conversation_id = ? AND user_id = ?',
    ).run(messageId, id, user.id);
    return id;
  });

  const forSender = findConversation(user.id, conversationId);
  const forRecipient = findConversation(recipientId, conversationId);
  if (forSender === undefined || forRecipient === undefined) {
    throw new Error('Conversation disappeared during send');
  }
  const saved = db
    .prepare(
      'SELECT * FROM messages WHERE conversation_id = ? AND sender_id = ? AND client_message_id = ?',
    )
    .get(conversationId, user.id, clientMessageId);
  const message = toMessage(messageRowSchema.parse(saved));

  return {
    recipientId,
    forSender: { conversation: forSender, message },
    forRecipient: { conversation: forRecipient, message },
  };
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
