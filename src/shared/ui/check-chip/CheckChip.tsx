'use client';

import type { ReactNode } from 'react';
import { Checkbox, type CheckboxProps } from 'react-aria-components';
import { Icon } from '../icon/Icon';
import styles from './CheckChip.module.css';

type CheckChipProps = Omit<CheckboxProps, 'className' | 'children'> & { children: ReactNode };

/** Pill with a checkbox for a list that can be switched on together with others. */
export function CheckChip({ children, ...props }: CheckChipProps) {
  return (
    <Checkbox {...props} className={styles.chip}>
      <span className={styles.box}>
        <Icon name="check" className={styles.check} />
      </span>
      {children}
    </Checkbox>
  );
}
