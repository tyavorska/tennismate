'use client';

import {
  Input,
  Label,
  SearchField as AriaSearchField,
  type SearchFieldProps as AriaSearchFieldProps,
} from 'react-aria-components';
import { Icon } from '../icon/Icon';
import { VisuallyHidden } from '../visually-hidden/VisuallyHidden';
import styles from './SearchField.module.css';

type SearchFieldProps = Omit<AriaSearchFieldProps, 'className' | 'children'> & {
  label: string;
  placeholder?: string;
};

/** Search box with a screen-reader label; the placeholder only hints at what can be typed. */
export function SearchField({ label, placeholder, ...props }: SearchFieldProps) {
  return (
    <AriaSearchField {...props} className={styles.field}>
      <Label>
        <VisuallyHidden>{label}</VisuallyHidden>
      </Label>
      <Icon name="search" className={styles.icon} />
      <Input className={styles.input} placeholder={placeholder} />
    </AriaSearchField>
  );
}
