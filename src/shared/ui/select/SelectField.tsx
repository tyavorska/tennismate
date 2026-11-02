'use client';

import {
  Button,
  Label,
  ListBox,
  ListBoxItem,
  Popover,
  Select,
  SelectValue,
} from 'react-aria-components';
import { Icon } from '../icon/Icon';
import styles from './SelectField.module.css';

export type SelectOption = Readonly<{ id: string; label: string }>;

type SelectFieldProps = {
  label: string;
  options: readonly SelectOption[];
  value: string;
  onChange: (id: string) => void;
  /** `pill` is a compact rounded control, `wide` the same at full width; `field` is a full-width form field with a label above. */
  variant?: 'pill' | 'wide' | 'field';
  /** Shows the label before the value ("I play at 3.5") instead of above it. */
  inlineLabel?: boolean;
  /** Keeps the label for screen readers only. */
  hideLabel?: boolean;
  className?: string;
};

export function SelectField({
  label,
  options,
  value,
  onChange,
  variant = 'field',
  inlineLabel = false,
  hideLabel = false,
  className,
}: SelectFieldProps) {
  const labelClass = hideLabel
    ? styles.hiddenLabel
    : inlineLabel
      ? styles.inlineLabel
      : styles.label;
  const classes = [styles.select, styles[variant], className].filter(Boolean).join(' ');

  return (
    <Select
      className={classes}
      selectedKey={value}
      onSelectionChange={(key) => {
        if (typeof key === 'string') onChange(key);
      }}
    >
      <Label className={labelClass}>{label}</Label>
      <Button className={styles.button}>
        <SelectValue />
        <Icon name="chevron" className={styles.chevron} />
      </Button>
      <Popover className={styles.popover} offset={4}>
        <ListBox className={styles.list}>
          {options.map((option) => (
            <ListBoxItem key={option.id} id={option.id} className={styles.item}>
              {option.label}
            </ListBoxItem>
          ))}
        </ListBox>
      </Popover>
    </Select>
  );
}
