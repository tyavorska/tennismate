import type { ReactNode } from 'react';
import { sampleConversations } from '@/entities/conversation';
import type { Player } from '@/entities/player';
import { InboxButton, InboxProvider } from '@/features/inbox';
import { ThemeToggle } from '@/features/toggle-theme';
import { ButtonLink, LogoLink } from '@/shared/ui';
import { AccountMenu } from './AccountMenu';
import { NavLink } from './NavLink';
import styles from './AppShell.module.css';

type AppShellProps = {
  viewer: Player;
  children: ReactNode;
};

export function AppShell({ viewer, children }: AppShellProps) {
  return (
    <InboxProvider conversations={sampleConversations}>
      <div className={styles.shell}>
        <header className={styles.header}>
          <div className={styles.bar}>
            <div className={styles.brand}>
              <LogoLink href="/players" className={styles.logo} />
              <p className={styles.city}>
                <span className={styles.cityDot} aria-hidden="true" />
                Kraków
              </p>
            </div>

            <nav className={styles.nav} aria-label="Main">
              <ul className={styles.navList}>
                {/* <li>
                  <NavLink href="/home">Home</NavLink>
                </li> */}
                <li>
                  <NavLink href="/players">Players</NavLink>
                </li>
                <li>
                  <NavLink href="/calendar">My calendar</NavLink>
                </li>
              </ul>
            </nav>

            <div className={styles.actions}>
              <InboxButton />
              <ThemeToggle />
              <ButtonLink href="/players?offer=1" className={styles.freeToPlay}>
                I&apos;m free to play
              </ButtonLink>
              <AccountMenu viewer={viewer} />
            </div>
          </div>
        </header>

        <main className={styles.content}>{children}</main>
      </div>
    </InboxProvider>
  );
}
