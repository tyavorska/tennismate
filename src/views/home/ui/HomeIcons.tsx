import styles from './HomeIcons.module.css';

const strokePaths = {
  search: 'M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM20 20l-4-4',
  calendar: 'M4 6h16v14H4zM4 10h16M9 3v4M15 3v4',
  trophy: 'M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0zM7 6H4a3 3 0 0 0 3 4M17 6h3a3 3 0 0 1-3 4',
  laptop: 'M3 5h18v11H3zM1 19h22',
  phone: 'M7 2h10a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1zM11 18h2',
} as const satisfies Record<string, string>;

export type HomeIconName = keyof typeof strokePaths | 'ball';

/** Outline icons for the landing cards; the ball is the filled tennis ball. */
export function HomeIcon({ name }: { name: HomeIconName }) {
  if (name === 'ball') {
    return (
      <svg className={styles.icon} viewBox="0 0 200 200" aria-hidden="true">
        <circle className={styles.ballFace} cx="100" cy="100" r="92" />
        <path className={styles.ballSeam} d="M30 48C80 74 80 126 30 152" />
        <path className={styles.ballSeam} d="M170 48C120 74 120 126 170 152" />
      </svg>
    );
  }
  return (
    <svg className={`${styles.icon} ${styles.stroke}`} viewBox="0 0 24 24" aria-hidden="true">
      <path d={strokePaths[name]} />
    </svg>
  );
}
