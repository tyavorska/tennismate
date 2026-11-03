'use client';

import { Switch } from '@/shared/ui';
import styles from './NotificationSettings.module.css';

const topics = [
  { id: 'messages', label: 'Invites and messages', defaultSelected: true },
  { id: 'payments', label: 'Split payment requests', defaultSelected: true },
  { id: 'tournaments', label: 'Tournament news', defaultSelected: false },
] as const;

export function NotificationSettings() {
  return (
    <div className={styles.list} role="group" aria-label="Notifications">
      {topics.map((topic) => (
        <Switch key={topic.id} defaultSelected={topic.defaultSelected}>
          {topic.label}
        </Switch>
      ))}
    </div>
  );
}
