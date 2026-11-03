'use client';

import { ToggleButton, type ToggleButtonProps } from 'react-aria-components';
import styles from './ToggleChip.module.css';

type ToggleChipProps = Omit<ToggleButtonProps, 'className'>;

/** Pill that switches a filter on and off. Announced as a toggle button. */
export function ToggleChip(props: ToggleChipProps) {
  return <ToggleButton {...props} className={styles.chip} />;
}
