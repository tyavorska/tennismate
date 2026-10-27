import { SignUpForm } from '@/features/sign-up';
import styles from './SignUpPage.module.css';

export function SignUpPage() {
  return (
    <main className={styles.page}>
      <SignUpForm headingLevel={1} />
    </main>
  );
}
