'use client';

import Link from 'next/link';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form } from 'react-aria-components';
import { useForm } from 'react-hook-form';
import { applyFieldErrors } from '@/shared/lib';
import { Button, FormAlert, FormTextField } from '@/shared/ui';
import { signUpDefaults, signUpSchema, type SignUpInput } from '../model/signUpSchema';
import { useSignUp } from '../model/useSignUp';
import styles from './SignUpForm.module.css';

const fields = ['email', 'password', 'confirmPassword'] as const;

type SignUpFormProps = {
  /** 1 when the form is the page's main content, 2 when it sits inside a labelled dialog. */
  headingLevel?: 1 | 2;
};

export function SignUpForm({ headingLevel = 2 }: SignUpFormProps) {
  const Heading = headingLevel === 1 ? 'h1' : 'h2';
  const signUp = useSignUp();
  const { control, handleSubmit, setError } = useForm<SignUpInput>({
    resolver: zodResolver(signUpSchema),
    defaultValues: signUpDefaults,
    mode: 'onTouched',
  });

  function onSubmit(values: SignUpInput) {
    if (signUp.isPending) return;
    signUp.mutate(values, {
      onError: (error) => applyFieldErrors(error.fieldErrors, fields, setError),
    });
  }

  // A taken email is shown under the email field instead.
  const formError =
    signUp.error !== null && !['validation', 'conflict'].includes(signUp.error.kind)
      ? signUp.error
      : undefined;

  return (
    <div className={styles.root}>
      <header className={styles.header}>
        <Heading className={styles.title}>Create your TennisMate account</Heading>
        <p className={styles.subtitle}>Find partners and organize matches.</p>
      </header>

      <Form className={styles.form} onSubmit={handleSubmit(onSubmit)} validationBehavior="aria">
        <FormTextField
          control={control}
          name="email"
          label="Email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
        />
        <FormTextField
          control={control}
          name="password"
          label="Password"
          type="password"
          autoComplete="new-password"
          placeholder="At least 8 characters"
        />
        <FormTextField
          control={control}
          name="confirmPassword"
          label="Confirm password"
          type="password"
          autoComplete="new-password"
          placeholder="Repeat your password"
        />

        {formError !== undefined && (
          <FormAlert referenceId={formError.kind === 'server' ? formError.requestId : undefined}>
            {formError.message}
          </FormAlert>
        )}

        <Button type="submit" isPending={signUp.isPending}>
          {signUp.isPending ? 'Creating account…' : 'Create account'}
        </Button>
      </Form>

      <div className={styles.links}>
        <Link href="/sign-in" replace className={styles.link}>
          Already have an account? Sign in
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
