import { OpenInboxButton } from '@/features/inbox';
import { Card } from '@/shared/ui';
import { InboxPreview } from './InboxPreview';
import styles from './PlayersAside.module.css';

export function PlayersAside() {
  return (
    <aside className={styles.aside} aria-label="Messages">
      <Card as="section" className={styles.panel} aria-labelledby="inbox-heading">
        <div className={styles.headingRow}>
          <h2 id="inbox-heading" className={styles.heading}>
            Inbox
          </h2>
          <OpenInboxButton />
        </div>
        <InboxPreview />
      </Card>
    </aside>
  );
}
