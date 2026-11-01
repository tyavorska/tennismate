'use client';

import Link from 'next/link';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form } from 'react-aria-components';
import { useForm } from 'react-hook-form';
import { applyFieldErrors } from '@/shared/lib';
import { Button, FormAlert, FormTextField, SocialAuth, VisuallyHidden } from '@/shared/ui';
import { signUpDefaults, signUpSchema, type SignUpInput } from '../model/signUpSchema';
import { useSignUp } from '../model/useSignUp';
import styles from './SignUpForm.module.css';

const fields = ['email', 'password'] as const;

type SignUpFormProps = {
  /** 1 when the form is the page's main content, 2 when it sits inside a labelled dialog. */
  headingLevel?: 1 | 2;
  /** Swaps the form in place instead of navigating to the other auth page. */
  onSwitch?: () => void;
  /** `inline` is the compact card on the landing page, `page` the full-size card on /sign-up. */
  layout?: 'inline' | 'page';
};

const roleIconPaths = {
  player: [
    'M19.25 11a8.25 8.25 0 1 1-16.5 0 8.25 8.25 0 0 1 16.5 0ZM4.583 5.5c2.75 2.75 2.75 8.25 0 11M17.417 5.5c-2.75 2.75-2.75 8.25 0 11',
  ],
  coach: [
    'M14.667 7.333a3.667 3.667 0 1 1-7.334 0 3.667 3.667 0 0 1 7.334 0ZM3.667 19.25c0-3.667 3.666-5.5 7.333-5.5s7.333 1.833 7.333 5.5',
  ],
  court: [
    'M4.583 4.583h12.834c1.012 0 1.833.821 1.833 1.834v9.166c0 1.013-.821 1.834-1.833 1.834H4.583a1.833 1.833 0 0 1-1.833-1.834V6.417c0-1.013.82-1.834 1.833-1.834ZM2.75 11h16.5M8.25 4.583v12.834M13.75 4.583v12.834',
  ],
} as const satisfies Record<string, readonly string[]>;

function RoleIcon({ icon }: { icon: keyof typeof roleIconPaths }) {
  return (
    <svg className={styles.roleIcon} viewBox="0 0 22 22" aria-hidden="true">
      {roleIconPaths[icon].map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  );
}

export function SignUpForm({ headingLevel = 2, onSwitch, layout = 'page' }: SignUpFormProps) {
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
    <div className={`${styles.root} ${styles[layout]}`}>
      <div className={styles.dots} aria-hidden="true">
        <span className={`${styles.dot} ${styles.dotActive}`} />
        <span className={styles.dot} />
        <span className={styles.dot} />
        <span className={styles.dot} />
      </div>

      <Heading className={styles.title}>Create your free account</Heading>

      <ul className={styles.roles} aria-label="Account type">
        <li className={`${styles.role} ${styles.roleSelected}`}>
          <span className={styles.roleTop}>
            <RoleIcon icon="player" />
          </span>
          <span className={styles.roleName}>Player</span>
          <span className={styles.roleText}>Find partners, book courts, join games</span>
          <VisuallyHidden>Selected</VisuallyHidden>
        </li>
        <li className={`${styles.role} ${styles.roleSoon}`}>
          <span className={styles.roleTop}>
            <RoleIcon icon="coach" />
            <span className={styles.tag}>Coming soon</span>
          </span>
          <span className={styles.roleName}>Coach</span>
          <span className={styles.roleText}>Get lesson requests, fill your calendar</span>
        </li>
        <li className={`${styles.role} ${styles.roleSoon}`}>
          <span className={styles.roleTop}>
            <RoleIcon icon="court" />
            <span className={styles.tag}>Coming soon</span>
          </span>
          <span className={styles.roleName}>Court / club</span>
          <span className={styles.roleText}>Publish free times and training offers</span>
        </li>
      </ul>

      <SocialAuth />

      <Form className={styles.form} onSubmit={handleSubmit(onSubmit)} validationBehavior="aria">
        <div className={styles.credentials}>
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
        </div>

        {formError !== undefined && (
          <FormAlert referenceId={formError.kind === 'server' ? formError.requestId : undefined}>
            {formError.message}
          </FormAlert>
        )}

        <Button type="submit" variant="ball" isPending={signUp.isPending}>
          {signUp.isPending ? 'Creating account…' : 'Create account'}
        </Button>
      </Form>

      <p className={styles.note}>
        Already a member?{' '}
        {onSwitch === undefined ? (
          <Link href="/sign-in" replace className={styles.link}>
            Log in
          </Link>
        ) : (
          <button type="button" className={styles.link} onClick={onSwitch}>
            Log in
          </button>
        )}{' '}
        · By joining you accept the{' '}
        <Link href="/terms" className={styles.link}>
          terms
        </Link>{' '}
        and{' '}
        <Link href="/privacy" className={styles.link}>
          privacy policy
        </Link>
        .
      </p>

      <p className={styles.privacy}>
        <svg className={styles.lock} viewBox="0 0 14 14" aria-hidden="true">
          <path d="M4.083 6.417h5.834c.644 0 1.166.522 1.166 1.166v3.5c0 .645-.522 1.167-1.166 1.167H4.083a1.167 1.167 0 0 1-1.166-1.167v-3.5c0-.644.522-1.166 1.166-1.166ZM4.667 6.417v-1.75a2.333 2.333 0 0 1 4.666 0v1.75" />
        </svg>
        Your email is never shown to other players and your password is stored only as a secure
        hash.
      </p>
    </div>
  );
}
