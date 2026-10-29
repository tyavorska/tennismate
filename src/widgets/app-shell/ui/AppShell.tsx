import Link from 'next/link';
import type { ReactNode } from 'react';
import type { Player } from '@/entities/player';
import { ThemeToggle } from '@/features/toggle-theme';
import { AccountMenu } from './AccountMenu';
import { NavLink } from './NavLink';
import styles from './AppShell.module.css';

function BallMark() {
  return (
    <svg className={styles.ball} viewBox="0 0 32 32" aria-hidden="true">
      <circle className={styles.ballFace} cx="16" cy="16" r="14.5" />
      <path className={styles.ballSeam} d="M5 6.5c5.5 4.6 5.5 14.4 0 19" />
      <path className={styles.ballSeam} d="M27 6.5c-5.5 4.6-5.5 14.4 0 19" />
    </svg>
  );
}

function PartnersIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="7.5" cy="7" r="3" />
      <circle cx="16.5" cy="7" r="3" />
      <path d="M3 20v-3.5a3 3 0 0 1 3-3h3a3 3 0 0 1 3 3V20M12 20v-3.5a3 3 0 0 1 3-3h3a3 3 0 0 1 3 3V20" />
    </svg>
  );
}

type AppShellProps = {
  viewer: Player;
  children: ReactNode;
};

export function AppShell({ viewer, children }: AppShellProps) {
  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <div className={styles.bar}>
          <Link href="/home" className={styles.logo}>
            <BallMark />
            <span className={styles.wordmark}>
              <span>Tennis</span>
              <span>Mate</span>
            </span>
          </Link>

          <nav className={styles.nav} aria-label="Main">
            <ul className={styles.navList}>
              <li>
                <NavLink href="/home" icon={<PartnersIcon />}>
                  Find match
                </NavLink>
              </li>
            </ul>
          </nav>

          <div className={styles.actions}>
            <ThemeToggle />
            <AccountMenu viewer={viewer} />
          </div>
        </div>
      </header>

      <main className={styles.content}>{children}</main>
    </div>
  );
}
