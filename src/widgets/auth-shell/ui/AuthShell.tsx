import type { ReactNode } from 'react';
import { ThemeToggle } from '@/features/toggle-theme';
import { LogoLink } from '@/shared/ui';
import styles from './AuthShell.module.css';

type AuthShellProps = {
  children: ReactNode;
};

/** Navy page with the wordmark on top and the form card centered below. */
export function AuthShell({ children }: AuthShellProps) {
  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <LogoLink href="/" />
        <ThemeToggle />
      </header>
      <div className={styles.stage}>{children}</div>
    </div>
  );
}
