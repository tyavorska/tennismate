'use client';

import { useState } from 'react';
import { Button } from '@/shared/ui';
import styles from './DeleteAccountButton.module.css';

type Step = 'idle' | 'confirm' | 'unavailable';

const labels = {
  idle: 'Delete account',
  confirm: 'Press again to delete your account',
  unavailable: 'Delete account',
} as const satisfies Record<Step, string>;

const nextStep = { idle: 'confirm', confirm: 'unavailable', unavailable: 'unavailable' } as const;

export function DeleteAccountButton() {
  const [step, setStep] = useState<Step>('idle');

  return (
    <div className={styles.root}>
      <Button variant="outline" className={styles.danger} onPress={() => setStep(nextStep[step])}>
        {labels[step]}
      </Button>
      <p className={styles.status} role="status">
        {step === 'unavailable' ? 'Deleting an account is not available yet.' : ''}
      </p>
    </div>
  );
}
