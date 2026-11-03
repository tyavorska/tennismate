import type { City } from '@/entities/city';
import { SignUpForm } from '@/features/sign-up';
import styles from './SignUpPage.module.css';

type SignUpPageProps = {
  cities: readonly City[];
};

export function SignUpPage({ cities }: SignUpPageProps) {
  return (
    <main className={styles.page}>
      <SignUpForm headingLevel={1} cities={cities} />
    </main>
  );
}
