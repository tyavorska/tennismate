'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { SignInForm } from '@/features/sign-in';
import { SignUpForm } from '@/features/sign-up';
import styles from './HeroAuthCard.module.css';

type Mode = 'sign-up' | 'sign-in';

const modeByHash: Readonly<Record<string, Mode | undefined>> = {
  '#sign-up': 'sign-up',
  '#sign-in': 'sign-in',
};

/**
 * The landing card. It starts on create account; the "Log in" links on the page, the
 * header and the bottom call to action all swap it in place instead of leaving the page.
 */
export function HeroAuthCard() {
  const [mode, setMode] = useState<Mode>('sign-up');
  const [focusRequest, setFocusRequest] = useState({ count: 0, scroll: false });
  const cardRef = useRef<HTMLDivElement>(null);

  const show = useCallback((next: Mode, scroll: boolean) => {
    setMode(next);
    setFocusRequest((previous) => ({ count: previous.count + 1, scroll }));
  }, []);

  useEffect(() => {
    function showFromHash() {
      const next = modeByHash[window.location.hash];
      if (next !== undefined) show(next, true);
    }

    function onClick(event: MouseEvent) {
      if (!(event.target instanceof Element)) return;
      const link = event.target.closest('a[href^="/#"]');
      if (!(link instanceof HTMLAnchorElement)) return;
      const next = modeByHash[new URL(link.href).hash];
      if (next === undefined) return;
      event.preventDefault();
      window.history.pushState(null, '', link.hash);
      show(next, true);
    }

    showFromHash();
    window.addEventListener('hashchange', showFromHash);
    document.addEventListener('click', onClick);
    return () => {
      window.removeEventListener('hashchange', showFromHash);
      document.removeEventListener('click', onClick);
    };
  }, [show]);

  // The link that was clicked may be gone after the swap, so move focus to the card.
  useEffect(() => {
    if (focusRequest.count === 0) return;
    const card = cardRef.current;
    if (card === null) return;
    card.scrollIntoView({ block: focusRequest.scroll ? 'center' : 'nearest' });
    card.focus({ preventScroll: true });
  }, [focusRequest]);

  return (
    <div ref={cardRef} tabIndex={-1} className={styles.card}>
      {mode === 'sign-up' ? (
        <SignUpForm headingLevel={2} layout="inline" onSwitch={() => show('sign-in', false)} />
      ) : (
        <SignInForm headingLevel={2} onSwitch={() => show('sign-up', false)} />
      )}
    </div>
  );
}
