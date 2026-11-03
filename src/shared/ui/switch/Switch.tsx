'use client';

import type { ReactNode } from 'react';
import { Switch as AriaSwitch, type SwitchProps as AriaSwitchProps } from 'react-aria-components';
import styles from './Switch.module.css';

type SwitchProps = Omit<AriaSwitchProps, 'className' | 'children'> & { children: ReactNode };

/** On/off setting with a visible label. Space toggles it. */
export function Switch({ children, ...props }: SwitchProps) {
  return (
    <AriaSwitch {...props} className={styles.switch}>
      <span className={styles.label}>{children}</span>
      <span className={styles.track} aria-hidden="true">
        <span className={styles.thumb} />
      </span>
    </AriaSwitch>
  );
}
