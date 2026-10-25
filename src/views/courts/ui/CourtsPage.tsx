import { courts, CourtCard } from '@/entities/court';
import styles from './CourtsPage.module.css';

export function CourtsPage() {
  return (
    <main className={styles.page}>
      <h1 className={styles.title}>Courts</h1>
      <p className={styles.subtitle}>Browse tennis courts and find a place to play.</p>
      <div className={styles.grid}>
        {courts.map((court) => (
          <CourtCard key={court.id} court={court} />
        ))}
      </div>
    </main>
  );
}
