import { ThemeToggle } from '@/features/toggle-theme';
import { ButtonLink, LogoLink } from '@/shared/ui';
import styles from './Header.module.css';

export function Header() {
  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <LogoLink href="/" />
        <nav className={styles.nav} aria-label="Main">
          <ThemeToggle />
          <ButtonLink href="/sign-in" variant="outlineOnDark" className={styles.login}>
            Log in
          </ButtonLink>
        </nav>
      </div>
    </header>
  );
}
