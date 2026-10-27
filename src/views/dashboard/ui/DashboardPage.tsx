import styles from './DashboardPage.module.css';

export function DashboardPage() {
  return (
    <section className={styles.page}>
      <h1 className={styles.title}>Home</h1>
      <p className={styles.text}>Welcome back. Your matches and partners will show up here.</p>
    </section>
  );
}
