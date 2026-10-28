'use client';

import Link from 'next/link';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form } from 'react-aria-components';
import { useForm } from 'react-hook-form';
import { applyFieldErrors } from '@/shared/lib';
import { Button, FormAlert, FormTextField } from '@/shared/ui';
import { signInDefaults, signInSchema, type SignInInput } from '../model/signInSchema';
import { useSignIn } from '../model/useSignIn';
import styles from './SignInForm.module.css';

type SignInFormProps = {
  /** 1 when the form is the page's main content, 2 when it sits inside a labelled dialog. */
  headingLevel?: 1 | 2;
  returnTo?: string;
};

const fields = ['email', 'password'] as const;

export function SignInForm({ headingLevel = 2, returnTo }: SignInFormProps) {
  const Heading = headingLevel === 1 ? 'h1' : 'h2';
  const signIn = useSignIn(returnTo ?? null);
  const { control, handleSubmit, setError } = useForm<SignInInput>({
    resolver: zodResolver(signInSchema),
    defaultValues: signInDefaults,
    mode: 'onTouched',
  });

  function onSubmit(values: SignInInput) {
    if (signIn.isPending) return;
    signIn.mutate(values, {
      onError: (error) => applyFieldErrors(error.fieldErrors, fields, setError),
    });
  }

  const formError =
    signIn.error !== null && signIn.error.kind !== 'validation' ? signIn.error : undefined;

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

        {formError !== undefined && (
          <FormAlert referenceId={formError.kind === 'server' ? formError.requestId : undefined}>
            {formError.message}
          </FormAlert>
        )}

        <Button type="submit" isPending={signIn.isPending}>
          {signIn.isPending ? 'Signing in…' : 'Sign in with email'}
        </Button>
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
