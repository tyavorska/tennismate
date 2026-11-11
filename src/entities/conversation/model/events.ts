import { z } from 'zod';
import { problemSchema } from '@/shared/api';
import {
  conversationSchema,
  messageSchema,
  messageTextSchema,
  newInviteSchema,
} from './conversation';

export const conversationEvents = {
  send: 'message:send',
  messageNew: 'message:new',
  respondToInvite: 'invite:respond',
  inviteUpdated: 'invite:updated',
  presenceSnapshot: 'presence:snapshot',
  presenceUpdate: 'presence:update',
} as const;

export const sendMessageRequestSchema = z.object({
  recipientId: z.uuid(),
  /** Unique per message and reused when a send is repeated, so a repeat never makes a duplicate. */
  clientMessageId: z.uuid(),
  text: messageTextSchema,
  invite: newInviteSchema.optional(),
});
export type SendMessageRequest = z.infer<typeof sendMessageRequestSchema>;

export const inviteResponseRequestSchema = z.object({
  inviteId: z.uuid(),
  /** The invitee accepts or declines. The proposer cancels. */
  action: z.enum(['accept', 'decline', 'cancel']),
});
export type InviteResponseRequest = z.infer<typeof inviteResponseRequestSchema>;

/** A message and the conversation it belongs to, as the receiving player sees it. */
export const messageNewEventSchema = z.object({
  conversation: conversationSchema,
  message: messageSchema,
});
export type MessageNewEvent = z.infer<typeof messageNewEventSchema>;

export const sendAckSchema = z.discriminatedUnion('ok', [
  z.object({ ok: z.literal(true), event: messageNewEventSchema }),
  z.object({ ok: z.literal(false), problem: problemSchema }),
]);
export type SendAck = z.infer<typeof sendAckSchema>;

export const presenceSnapshotSchema = z.object({ onlineIds: z.array(z.uuid()) });
export type PresenceSnapshot = z.infer<typeof presenceSnapshotSchema>;

export const presenceUpdateSchema = z.object({ userId: z.uuid(), online: z.boolean() });
export type PresenceUpdate = z.infer<typeof presenceUpdateSchema>;

/** Payloads cross the network, so handlers receive JSON and parse it with the schemas above. */
type Json = z.core.util.JSONType;

export type ClientToServerEvents = {
  'message:send': (payload: Json, acknowledge: (ack: SendAck) => void) => void;
  'invite:respond': (payload: Json, acknowledge: (ack: SendAck) => void) => void;
};

export type ServerToClientEvents = {
  'message:new': (event: MessageNewEvent) => void;
  /** A message that changed, such as an invite that was accepted. */
  'invite:updated': (event: MessageNewEvent) => void;
  'presence:snapshot': (snapshot: PresenceSnapshot) => void;
  'presence:update': (update: PresenceUpdate) => void;
};
