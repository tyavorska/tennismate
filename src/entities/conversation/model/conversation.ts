import { z } from 'zod';

export const messageSchema = z.object({
  id: z.string().min(1),
  from: z.enum(['me', 'them']),
  text: z.string().min(1),
  time: z.string().min(1),
});
export type Message = Readonly<z.infer<typeof messageSchema>>;

export const conversationSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  initials: z.string().min(1),
  subtitle: z.string().min(1),
  /** Short text and time shown in the list; the thread below holds the full history. Empty until the first message. */
  preview: z.string(),
  lastAt: z.string(),
  unread: z.boolean(),
  online: z.boolean(),
  /** The game the two players have planned, if any. */
  plan: z.string().min(1).optional(),
  messages: z.array(messageSchema),
});
export type Conversation = Readonly<z.infer<typeof conversationSchema>>;

export function unreadCount(conversations: readonly Conversation[]): number {
  return conversations.filter((conversation) => conversation.unread).length;
}
