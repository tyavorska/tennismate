import Link from 'next/link';
import type { ReactNode } from 'react';
import { ThemeToggle } from '@/features/toggle-theme';
import { SidebarLink } from './SidebarLink';
import styles from './AppShell.module.css';

function HomeIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" />
    </svg>
  );
}

function AccountIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21a8 8 0 0 1 16 0" />
    </svg>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar}>
        <Link href="/home" className={styles.logo}>
          TennisMate
        </Link>

        <nav className={styles.nav} aria-label="Main">
          <SidebarLink href="/home" icon={<HomeIcon />}>
            Home
          </SidebarLink>
        </nav>

        <div className={styles.bottom}>
          <ThemeToggle />
          <SidebarLink href="/account" icon={<AccountIcon />}>
            Account
          </SidebarLink>
        </div>
      </aside>

      <main className={styles.content}>{children}</main>
    </div>
  );
}
