import { returnToParam, SignInForm } from '@/features/sign-in';
import styles from './SignInPage.module.css';

type SignInPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function SignInPage({ searchParams }: SignInPageProps) {
  const returnTo = returnToParam(await searchParams);
  return (
    <main className={styles.page}>
      <SignInForm headingLevel={1} returnTo={returnTo} />
    </main>
  );
}
