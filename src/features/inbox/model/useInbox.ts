import { useState } from 'react';
import type { Conversation } from '@/entities/conversation';

const timeFormat = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit' });

export type Invite = {
  /** A day and time, such as "Tomorrow 10:00". */
  slot: string;
  court: string;
};

/** Who a chat is with. A conversation is created for the player the first time it is opened. */
export type ChatPlayer = {
  id: string;
  name: string;
  initials: string;
  subtitle: string;
};

export type Inbox = {
  conversations: readonly Conversation[];
  markRead: (id: string) => void;
  /** Adds an empty conversation with the player unless there already is one. */
  ensure: (player: ChatPlayer) => void;
  send: (id: string, text: string) => void;
  /** Sends a "let's play" invite and records it as the planned game. */
  invite: (id: string, invite: Invite) => void;
};

/** Keeps the conversations in state so reading and replying update the list and the badge. */
export function useInbox(initial: readonly Conversation[]): Inbox {
  const [conversations, setConversations] = useState(initial);

  function update(id: string, change: (conversation: Conversation) => Conversation): void {
    setConversations((current) =>
      current.map((conversation) => (conversation.id === id ? change(conversation) : conversation)),
    );
  }

  function append(id: string, text: string, plan?: string): void {
    const time = timeFormat.format(new Date());
    update(id, (conversation) => ({
      ...conversation,
      plan: plan ?? conversation.plan,
      preview: text,
      lastAt: time,
      messages: [
        ...conversation.messages,
        { id: `m${conversation.messages.length + 1}`, from: 'me', text, time },
      ],
    }));
  }

  return {
    conversations,
    ensure: (player) =>
      setConversations((current) =>
        current.some((conversation) => conversation.id === player.id)
          ? current
          : [
              ...current,
              { ...player, preview: '', lastAt: '', unread: false, online: false, messages: [] },
            ],
      ),
    markRead: (id) => update(id, (conversation) => ({ ...conversation, unread: false })),
    send: (id, text) => {
      const trimmed = text.trim();
      if (trimmed !== '') append(id, trimmed);
    },
    invite: (id, { slot, court }) =>
      append(id, `Let's play at ${court}, ${slot}?`, `${slot} · ${court}`),
  };
}
