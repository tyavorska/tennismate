'use client';

import { Button, Icon, VisuallyHidden } from '@/shared/ui';
import { useInboxControls } from './InboxProvider';
import styles from './InboxButton.module.css';

/** Messages button for the navy header. Opens the inbox in a drawer. */
export function InboxButton() {
  const { unread, open } = useInboxControls();

  return (
    <Button variant="outlineOnDark" className={styles.button} onPress={() => open()}>
      <Icon name="messages" strokeWidth={2} className={styles.icon} />
      <span className={styles.label}>Messages</span>
      {unread > 0 && (
        <>
          <span className={styles.badge} aria-hidden="true">
            {unread}
          </span>
          <VisuallyHidden>, {unread} unread</VisuallyHidden>
        </>
      )}
    </Button>
  );
}
