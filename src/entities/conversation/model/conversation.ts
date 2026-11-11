import { z } from 'zod';

export const maxMessageLength = 2000;

export const messageTextSchema = z
  .string()
  .trim()
  .min(1, 'Write a message')
  .max(maxMessageLength, `Messages are at most ${maxMessageLength} characters`);

const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const timeSchema = z.string().regex(/^\d{2}:\d{2}$/);

/** What a player proposes: a court of their city, a day and a time there. */
export const newInviteSchema = z.object({
  court: z.string().trim().min(1).max(100),
  date: dateSchema,
  time: timeSchema,
});
export type NewInvite = z.infer<typeof newInviteSchema>;

/** `expired` is worked out from the time: a pending invite whose time has passed. */
export const inviteStatusSchema = z.enum([
  'pending',
  'accepted',
  'declined',
  'cancelled',
  'expired',
]);
export type InviteStatus = z.infer<typeof inviteStatusSchema>;

/** A "let's play" invite as it stands now. The day and time are in the city of both players. */
export const inviteSchema = z.object({
  id: z.uuid(),
  status: inviteStatusSchema,
  proposerId: z.uuid(),
  court: z.string().min(1),
  date: dateSchema,
  time: timeSchema,
  startsAt: z.iso.datetime(),
});
export type Invite = Readonly<z.infer<typeof inviteSchema>>;

/** The next game the two players have agreed on. */
export const planSchema = z.object({
  court: z.string().min(1),
  date: dateSchema,
  time: timeSchema,
});
export type Plan = Readonly<z.infer<typeof planSchema>>;

export const messageSchema = z.object({
  id: z.uuid(),
  conversationId: z.uuid(),
  senderId: z.uuid(),
  clientMessageId: z.uuid(),
  text: z.string().min(1),
  /** Set when the message is a "let's play" invite. */
  invite: inviteSchema.optional(),
  sentAt: z.iso.datetime(),
});
export type Message = Readonly<z.infer<typeof messageSchema>>;

/** Who a chat is with. Holds no email and no coordinates. */
export const chatPartnerSchema = z.object({
  id: z.uuid(),
  name: z.string().min(1),
  initials: z.string().min(1),
  subtitle: z.string().min(1),
});
export type ChatPartner = Readonly<z.infer<typeof chatPartnerSchema>>;

/** One conversation as the signed-in player sees it. */
export const conversationSchema = z.object({
  id: z.uuid(),
  partner: chatPartnerSchema,
  lastMessage: messageSchema,
  /** The next game they have agreed on, if any. */
  plan: planSchema.optional(),
  unreadCount: z.number().int().nonnegative(),
});
export type Conversation = Readonly<z.infer<typeof conversationSchema>>;

export function unreadConversations(conversations: readonly Conversation[]): number {
  return conversations.filter((conversation) => conversation.unreadCount > 0).length;
}
