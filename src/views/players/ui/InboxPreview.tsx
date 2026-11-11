'use client';

import { formatListTime } from '@/entities/conversation';
import { OpenChatButton, useConversations, useInboxControls, useIsOnline } from '@/features/inbox';
import type { Conversation } from '@/entities/conversation';
import { Avatar, VisuallyHidden } from '@/shared/ui';
import styles from './PlayersAside.module.css';

const previewLimit = 4;

function PreviewRow({ conversation, timezone }: { conversation: Conversation; timezone: string }) {
  const isOnline = useIsOnline(conversation.partner.id);
  const isUnread = conversation.unreadCount > 0;

  return (
    <li>
      <OpenChatButton partner={conversation.partner} className={styles.message}>
        <Avatar initials={conversation.partner.initials} online={isOnline} />
        <span className={styles.messageBody}>
          <span className={styles.messageTop}>
            <strong className={styles.name}>{conversation.partner.name}</strong>
            <span className={styles.time}>
              {formatListTime(conversation.lastMessage.sentAt, timezone, new Date())}
            </span>
          </span>
          <span className={isUnread ? styles.previewUnread : styles.preview}>
            {conversation.lastMessage.text}
          </span>
        </span>
        {isUnread && (
          <span className={styles.unread}>
            <VisuallyHidden>Unread</VisuallyHidden>
          </span>
        )}
        {isOnline && <VisuallyHidden>Online</VisuallyHidden>}
      </OpenChatButton>
    </li>
  );
}

/** The latest conversations, kept up to date by the socket through the query cache. */
export function InboxPreview() {
  const { timezone } = useInboxControls();
  const { data = [], isPending } = useConversations();

  if (isPending) return <p className={styles.preview}>Loading…</p>;
  if (data.length === 0) return <p className={styles.preview}>No messages yet.</p>;
  return (
    <ul className={styles.messages}>
      {data.slice(0, previewLimit).map((conversation) => (
        <PreviewRow key={conversation.id} conversation={conversation} timezone={timezone} />
      ))}
    </ul>
  );
}
