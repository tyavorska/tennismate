'use client';

import { useEffect, useRef, useState } from 'react';
import { SignInForm } from '@/features/sign-in';
import { SignUpForm } from '@/features/sign-up';
import styles from './HeroAuthCard.module.css';

type Mode = 'sign-up' | 'sign-in';

/** The landing card: create account first, "Log in" swaps it for the log in form in place. */
export function HeroAuthCard() {
  const [mode, setMode] = useState<Mode>('sign-up');
  const cardRef = useRef<HTMLDivElement>(null);
  const hasSwitched = useRef(false);

  // The link that was clicked disappears, so move focus to the card for keyboard and screen reader users.
  useEffect(() => {
    if (!hasSwitched.current) return;
    cardRef.current?.focus();
  }, [mode]);

  function switchTo(next: Mode) {
    hasSwitched.current = true;
    setMode(next);
  }

  return (
    <div ref={cardRef} tabIndex={-1} className={styles.card}>
      {mode === 'sign-up' ? (
        <SignUpForm headingLevel={2} layout="inline" onSwitch={() => switchTo('sign-in')} />
      ) : (
        <SignInForm headingLevel={2} onSwitch={() => switchTo('sign-up')} />
      )}
    </div>
  );
}
