import type { Court } from '../model/types';
import styles from './CourtCard.module.css';

type CourtCardProps = {
  court: Court;
};

export function CourtCard({ court }: CourtCardProps) {
  const setting = court.indoor ? 'Indoor' : 'Outdoor';

  return (
    <article className={styles.card}>
      <h3 className={styles.name}>{court.name}</h3>
      <p className={styles.city}>{court.city}</p>
      <ul className={styles.tags}>
        <li className={styles.tag}>{court.surface}</li>
        <li className={styles.tag}>{setting}</li>
        <li className={styles.tag}>{court.courtCount} courts</li>
      </ul>
    </article>
  );
}
