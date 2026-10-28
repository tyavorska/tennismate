import type { ReactNode } from 'react';
import styles from './FormAlert.module.css';

type FormAlertProps = {
  children: ReactNode;
  referenceId?: string;
};

export function FormAlert({ children, referenceId }: FormAlertProps) {
  return (
    <div role="alert" className={styles.alert}>
      <p>{children}</p>
      {referenceId !== undefined && (
        <p className={styles.reference}>Reference: {referenceId.slice(0, 8)}</p>
      )}
    </div>
  );
}
