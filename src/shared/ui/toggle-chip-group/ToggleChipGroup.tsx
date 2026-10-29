'use client';

import type { ReactNode } from 'react';
import { ToggleButton, ToggleButtonGroup, type Key } from 'react-aria-components';
import styles from './ToggleChipGroup.module.css';

export type ToggleChipOption<Id extends string> = Readonly<{
  id: Id;
  label: string;
  icon?: ReactNode;
}>;

type ToggleChipGroupProps<Id extends string> = {
  /** Accessible name of the group. */
  label: string;
  options: readonly ToggleChipOption<Id>[];
  value: Id;
  onChange: (value: Id) => void;
};

function CheckIcon() {
  return (
    <svg className={styles.check} viewBox="0 0 24 24" aria-hidden="true">
      <path d="m5 12.5 4.5 4.5L19 7.5" />
    </svg>
  );
}

/** A row of pill buttons where exactly one is pressed. Arrow keys move between them. */
export function ToggleChipGroup<Id extends string>({
  label,
  options,
  value,
  onChange,
}: ToggleChipGroupProps<Id>) {
  const handleSelectionChange = (keys: Set<Key>): void => {
    const selected = options.find((option) => keys.has(option.id));
    if (selected !== undefined) onChange(selected.id);
  };

  return (
    <ToggleButtonGroup
      className={styles.group}
      aria-label={label}
      selectionMode="single"
      disallowEmptySelection
      selectedKeys={[value]}
      onSelectionChange={handleSelectionChange}
    >
      {options.map((option) => (
        <ToggleButton key={option.id} id={option.id} className={styles.chip}>
          <CheckIcon />
          {option.icon}
          {option.label}
        </ToggleButton>
      ))}
    </ToggleButtonGroup>
  );
}
