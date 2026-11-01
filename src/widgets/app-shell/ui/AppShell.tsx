import type { ReactNode } from 'react';
import type { Player } from '@/entities/player';
import { ThemeToggle } from '@/features/toggle-theme';
import { LogoLink } from '@/shared/ui';
import { AccountMenu } from './AccountMenu';
import { NavLink } from './NavLink';
import styles from './AppShell.module.css';

type AppShellProps = {
  viewer: Player;
  children: ReactNode;
};

export function AppShell({ viewer, children }: AppShellProps) {
  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <div className={styles.bar}>
          <LogoLink href="/home" />

          <p className={styles.city}>
            <span className={styles.cityDot} aria-hidden="true" />
            Kraków
          </p>

          <nav className={styles.nav} aria-label="Main">
            <ul className={styles.navList}>
              <li>
                <NavLink href="/home">Home</NavLink>
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
