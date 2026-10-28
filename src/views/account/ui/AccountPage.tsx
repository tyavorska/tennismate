import { SignOutButton } from '@/features/sign-out';
import { getCurrentUser } from '@/server/auth';
import styles from './AccountPage.module.css';

export async function AccountPage() {
  const user = await getCurrentUser();

  return (
    <section className={styles.page}>
      <h1 className={styles.title}>Account</h1>
      {user !== undefined && <p className={styles.text}>Signed in as {user.email}</p>}
      <div>
        <SignOutButton />
      </div>
    </section>
  );
}
