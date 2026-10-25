import Link from 'next/link';
import { courts, CourtCard } from '@/entities/court';
import styles from './HomePage.module.css';

const featuredCourts = courts.slice(0, 3);

const highlights = [
  { title: 'Find partners', text: 'Meet players near you who match your level and schedule.' },
  { title: 'Organize matches', text: 'Pick a court, set a time and invite someone to play.' },
  { title: 'Discover courts', text: 'Browse courts by city, surface and indoor or outdoor.' },
];

export function HomePage() {
  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <h1 className={styles.title}>Find your next tennis partner</h1>
        <p className={styles.subtitle}>
          TennisMate helps tennis players connect, book courts and organize matches in minutes.
        </p>
        <div className={styles.actions}>
          <Link href="/sign-up" className={styles.primary}>
            Sign up
          </Link>
          <Link href="/sign-in" className={styles.secondary}>
            Sign in
          </Link>
        </div>
      </section>

      <section className={styles.section} aria-labelledby="how-it-works">
        <h2 id="how-it-works" className={styles.heading}>
          How it works
        </h2>
        <ul className={styles.highlights}>
          {highlights.map((item) => (
            <li key={item.title} className={styles.highlight}>
              <h3>{item.title}</h3>
              <p className={styles.muted}>{item.text}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className={styles.section} aria-labelledby="featured-courts">
        <div className={styles.sectionHeader}>
          <h2 id="featured-courts" className={styles.heading}>
            Featured courts
          </h2>
          <Link href="/courts">View all courts</Link>
        </div>
        <div className={styles.grid}>
          {featuredCourts.map((court) => (
            <CourtCard key={court.id} court={court} />
          ))}
        </div>
      </section>
    </main>
  );
}
