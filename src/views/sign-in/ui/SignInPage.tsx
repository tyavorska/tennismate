import { SignInForm } from '@/features/sign-in';
import styles from './SignInPage.module.css';

export function SignInPage() {
  return (
    <main className={styles.page}>
      <SignInForm headingLevel={1} />
    </main>
  );
}
