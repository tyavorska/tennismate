'use client';

import Link from 'next/link';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form } from 'react-aria-components';
import { useForm } from 'react-hook-form';
import { applyFieldErrors } from '@/shared/lib';
import { Button, FormAlert, FormTextField, SocialAuth } from '@/shared/ui';
import { signInDefaults, signInSchema, type SignInInput } from '../model/signInSchema';
import { useSignIn } from '../model/useSignIn';
import styles from './SignInForm.module.css';

type SignInFormProps = {
  /** 1 when the form is the page's main content, 2 when it sits inside a labelled dialog. */
  headingLevel?: 1 | 2;
  /** Swaps the form in place instead of navigating to the other auth page. */
  onSwitch?: () => void;
  returnTo?: string;
};

const fields = ['email', 'password'] as const;

export function SignInForm({ headingLevel = 2, onSwitch, returnTo }: SignInFormProps) {
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
      <Heading className={styles.title}>Welcome back</Heading>

      <SocialAuth />

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
          placeholder="Your password"
        />

        <Link href="/forgot-password" className={styles.forgot}>
          Forgot password?
        </Link>

        {formError !== undefined && (
          <FormAlert referenceId={formError.kind === 'server' ? formError.requestId : undefined}>
            {formError.message}
          </FormAlert>
        )}

        <Button type="submit" variant="ball" isPending={signIn.isPending}>
          {signIn.isPending ? 'Logging in…' : 'Log in'}
        </Button>
      </Form>

      <p className={styles.note}>
        New to Let.?{' '}
        {onSwitch === undefined ? (
          <Link href="/sign-up" replace className={styles.link}>
            Create a free account
          </Link>
        ) : (
          <button type="button" className={styles.link} onClick={onSwitch}>
            Create a free account
          </button>
        )}
      </p>
    </div>
  );
}
