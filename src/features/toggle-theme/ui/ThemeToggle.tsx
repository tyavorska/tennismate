'use client';

import { useLayoutEffect, useSyncExternalStore } from 'react';
import {
  applyTheme,
  getNextTheme,
  readTheme,
  resolveInitialTheme,
  type Theme,
} from '../model/theme';
import styles from './ThemeToggle.module.css';

function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  return () => observer.disconnect();
}

const getServerTheme = (): Theme => 'light';

/** Round button for navy bars: a moon in the light theme (tap for dark), a sun in the dark one. */
export function ThemeToggle() {
  const theme = useSyncExternalStore(subscribe, readTheme, getServerTheme);

  // Dev Strict Mode remounts can clear the attribute the init script set; re-apply it before paint.
  useLayoutEffect(() => {
    document.documentElement.dataset.theme = resolveInitialTheme();
  }, []);

  return (
    <button
      type="button"
      role="switch"
      aria-checked={theme === 'dark'}
      aria-label="Dark theme"
      className={styles.switch}
      onClick={() => applyTheme(getNextTheme(theme))}
    >
      <svg className={`${styles.icon} ${styles.sun}`} viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
      </svg>
      <svg className={`${styles.icon} ${styles.moon}`} viewBox="0 0 18 18" aria-hidden="true">
        <path d="M15.75 9.6a6.75 6.75 0 1 1-7.35-7.35 5.4 5.4 0 0 0 7.35 7.35z" />
      </svg>
    </button>
  );
}
