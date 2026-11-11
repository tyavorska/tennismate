import { z } from 'zod';
import { apiFetch } from '@/shared/api';
import {
  conversationSchema,
  messageSchema,
  type Conversation,
  type Message,
} from '../model/conversation';

export const conversationApi = {
  list: (): Promise<readonly Conversation[]> =>
    apiFetch('/api/conversations', { schema: z.array(conversationSchema) }),
  /** The latest messages, or only those after `after` (a message id) when catching up. */
  messages: (conversationId: string, after?: string): Promise<readonly Message[]> =>
    apiFetch(
      `/api/conversations/${conversationId}/messages${after === undefined ? '' : `?after=${after}`}`,
      { schema: z.array(messageSchema) },
    ),
  markRead: (conversationId: string): Promise<undefined> =>
    apiFetch(`/api/conversations/${conversationId}/read`, {
      method: 'PUT',
      schema: z.undefined(),
    }),
};
