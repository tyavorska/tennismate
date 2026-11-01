import styles from './Logo.module.css';

/** The "let" wordmark with the tennis ball as its full stop. Decorative: the parent link names it. */
export function Logo() {
  return (
    <span className={styles.logo}>
      <span aria-hidden="true">let</span>
      <svg className={styles.ball} viewBox="0 0 13 13" aria-hidden="true">
        <circle cx="6.5" cy="6.5" r="6.5" />
      </svg>
    </span>
  );
}
