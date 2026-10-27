'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form } from 'react-aria-components';
import { useForm } from 'react-hook-form';
import { Button, FormTextField } from '@/shared/ui';
import { signInDefaults, signInSchema, type SignInInput } from '../model/signInSchema';
import styles from './SignInForm.module.css';

type SignInFormProps = {
  /** 1 when the form is the page's main content, 2 when it sits inside a labelled dialog. */
  headingLevel?: 1 | 2;
};

export function SignInForm({ headingLevel = 2 }: SignInFormProps) {
  const Heading = headingLevel === 1 ? 'h1' : 'h2';
  const router = useRouter();
  const { control, handleSubmit } = useForm<SignInInput>({
    resolver: zodResolver(signInSchema),
    defaultValues: signInDefaults,
    mode: 'onTouched',
  });

  function onSubmit() {
    // TODO: replace with a real sign-in call once auth exists. For now any valid input
    // goes straight to the signed-in area so the layout can be worked on.
    router.push('/home');
  }

  return (
    <div className={styles.root}>
      <header className={styles.header}>
        <Heading className={styles.title}>Sign in to TennisMate</Heading>
        <p className={styles.subtitle}>Use the same account as the TennisMate app.</p>
      </header>

      <div className={styles.providers}>
        <Button variant="secondary" isDisabled>
          Continue with Google
        </Button>
        <Button variant="secondary" isDisabled>
          Continue with Apple
        </Button>
      </div>

      <p className={styles.divider}>
        <span>or email</span>
      </p>

      <Form className={styles.form} onSubmit={handleSubmit(onSubmit)} validationBehavior="aria">
        <FormTextField
          control={control}
          name="email"
          type="email"
          label="Email"
          autoComplete="email"
          placeholder="you@example.com"
        />
        <FormTextField
          control={control}
          name="password"
          type="password"
          label="Password"
          autoComplete="current-password"
          placeholder="At least 8 characters"
        />

        <Button type="submit">Sign in with email</Button>
      </Form>

      <div className={styles.links}>
        <Link href="/sign-up" replace className={styles.link}>
          Create account
        </Link>
        <Link href="/forgot-password" className={styles.link}>
          Forgot password?
        </Link>
      </div>

      <footer className={styles.legal}>
        <Link href="/privacy" className={styles.legalLink}>
          Privacy
        </Link>
        <span aria-hidden="true">·</span>
        <Link href="/terms" className={styles.legalLink}>
          Terms
        </Link>
      </footer>
    </div>
  );
}
