import Link from 'next/link';
import { sampleConversations } from '@/entities/conversation';
import { NextGameList, sampleNextGames } from '@/entities/game';
import { OpenChatButton, OpenInboxButton } from '@/features/inbox';
import { Avatar, Card, VisuallyHidden } from '@/shared/ui';
import styles from './PlayersAside.module.css';

export function PlayersAside() {
  return (
    <aside className={styles.aside} aria-label="Messages and games">
      <Card as="section" className={styles.panel} aria-labelledby="inbox-heading">
        <div className={styles.headingRow}>
          <h2 id="inbox-heading" className={styles.heading}>
            Inbox
          </h2>
          <OpenInboxButton />
        </div>
        <ul className={styles.messages}>
          {sampleConversations.slice(0, 4).map((message) => (
            <li key={message.id}>
              <OpenChatButton conversationId={message.id} className={styles.message}>
                <Avatar initials={message.initials} online={message.online} />
                <span className={styles.messageBody}>
                  <span className={styles.messageTop}>
                    <strong className={styles.name}>{message.name}</strong>
                    <span className={styles.time}>{message.lastAt}</span>
                  </span>
                  <span className={message.unread ? styles.previewUnread : styles.preview}>
                    {message.preview}
                  </span>
                </span>
                {message.unread && (
                  <span className={styles.unread}>
                    <VisuallyHidden>Unread</VisuallyHidden>
                  </span>
                )}
                {message.online && <VisuallyHidden>Online</VisuallyHidden>}
              </OpenChatButton>
            </li>
          ))}
        </ul>
      </Card>

      <Card as="section" className={styles.panel} aria-labelledby="next-games-heading">
        <div className={styles.headingRow}>
          <h2 id="next-games-heading" className={styles.heading}>
            Next games
          </h2>
          <Link href="/calendar" className={styles.calendarLink}>
            Calendar →
          </Link>
        </div>
        <NextGameList games={sampleNextGames} />
      </Card>
    </aside>
  );
}
