import type { ReactNode } from 'react';
import styles from './VisuallyHidden.module.css';

/** Text for screen readers only. Never use display: none for this; it hides it from them too. */
export function VisuallyHidden({ children }: { children: ReactNode }) {
  return <span className={styles.hidden}>{children}</span>;
}
