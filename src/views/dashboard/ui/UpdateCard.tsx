import type { ReactNode } from 'react';
import { Avatar } from '@/shared/ui';
import styles from './UpdateCard.module.css';

type UpdateCardProps = {
  kind: string;
  title: string;
  text: string;
  faces?: ReadonlyArray<{ readonly name: string; readonly initials: string }>;
  action?: ReactNode;
};

/** One tile of the "Today in Kraków tennis" feed. */
export function UpdateCard({ kind, title, text, faces = [], action }: UpdateCardProps) {
  return (
    <li className={styles.card}>
      <div className={styles.content}>
        <p className={styles.tag}>
          <span className={styles.dot} aria-hidden="true" />
          {kind}
        </p>
        <h3 className={styles.title}>{title}</h3>
        <p className={styles.text}>{text}</p>
      </div>

      {(faces.length > 0 || action !== undefined) && (
        <div className={styles.footer}>
          <span className={styles.faces}>
            {faces.map((face) => (
              <Avatar key={face.name} initials={face.initials} className={styles.face} />
            ))}
          </span>
          {action}
        </div>
      )}
    </li>
  );
}
