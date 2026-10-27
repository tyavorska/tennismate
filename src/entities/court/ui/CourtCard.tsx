import type { Court } from '../model/types';
import styles from './CourtCard.module.css';

type CourtCardProps = {
  court: Court;
  /** Match the surrounding outline: 2 under a page h1, 3 under a section h2. */
  headingLevel?: 2 | 3;
};

export function CourtCard({ court, headingLevel = 3 }: CourtCardProps) {
  const Heading = headingLevel === 2 ? 'h2' : 'h3';
  const setting = court.indoor ? 'Indoor' : 'Outdoor';

  return (
    <article className={styles.card}>
      <Heading className={styles.name}>{court.name}</Heading>
      <p className={styles.city}>{court.city}</p>
      <ul className={styles.tags}>
        <li className={styles.tag}>{court.surface}</li>
        <li className={styles.tag}>{setting}</li>
        <li className={styles.tag}>{court.courtCount} courts</li>
      </ul>
    </article>
  );
}
