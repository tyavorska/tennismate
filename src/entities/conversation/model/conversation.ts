import { z } from 'zod';

export const maxMessageLength = 2000;

export const messageTextSchema = z
  .string()
  .trim()
  .min(1, 'Write a message')
  .max(maxMessageLength, `Messages are at most ${maxMessageLength} characters`);

/** A proposed court and time, such as "Kazimierz Clay Club" and "Tomorrow 10:00". */
export const inviteSchema = z.object({
  court: z.string().trim().min(1).max(100),
  slot: z.string().trim().min(1).max(100),
});
export type Invite = Readonly<z.infer<typeof inviteSchema>>;

export const messageSchema = z.object({
  id: z.uuid(),
  conversationId: z.uuid(),
  senderId: z.uuid(),
  clientMessageId: z.uuid(),
  text: z.string().min(1),
  /** Set when the message proposes a court and a time. */
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
  /** The latest invite in the conversation, from either player. */
  plan: inviteSchema.optional(),
  unreadCount: z.number().int().nonnegative(),
});
export type Conversation = Readonly<z.infer<typeof conversationSchema>>;

export function unreadConversations(conversations: readonly Conversation[]): number {
  return conversations.filter((conversation) => conversation.unreadCount > 0).length;
}
