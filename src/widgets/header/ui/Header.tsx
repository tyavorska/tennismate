import Link from 'next/link';
import { ThemeToggle } from '@/features/toggle-theme';
import styles from './Header.module.css';

export function Header() {
  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <Link href="/" className={styles.logo}>
          TennisMate
        </Link>
        <nav className={styles.nav} aria-label="Main">
          <Link href="/courts" className={styles.link}>
            Courts
          </Link>
          <Link href="/sign-in" className={styles.cta}>
            Sign in
          </Link>
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
