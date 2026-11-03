import Link from 'next/link';
import type { NextGame } from '../model/nextGame';
import styles from './NextGameList.module.css';

type NextGameListProps = {
  games: readonly NextGame[];
};

const statusLabels = {
  confirmed: '✓ Confirmed',
  waiting: 'Waiting for reply',
} as const satisfies Record<NextGame['status'], string>;

/** The viewer's coming games. Each one opens its day in the calendar. */
export function NextGameList({ games }: NextGameListProps) {
  return (
    <ul className={styles.list}>
      {games.map((game) => (
        <li key={game.id}>
          <Link href={`/calendar?day=${game.date}`} className={styles.game}>
            <span className={styles.date}>
              <span className={styles.weekday}>{game.weekday}</span>
              <span className={styles.day}>{game.day}</span>
            </span>
            <span className={styles.text}>
              <strong className={styles.title}>{game.title}</strong>
              <span className={styles.details}>{game.details}</span>
              <span className={game.status === 'confirmed' ? styles.confirmed : styles.waiting}>
                {statusLabels[game.status]}
              </span>
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
