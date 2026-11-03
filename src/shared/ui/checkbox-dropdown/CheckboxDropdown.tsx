'use client';

import {
  Button,
  Checkbox,
  CheckboxGroup,
  Dialog,
  DialogTrigger,
  Popover,
} from 'react-aria-components';
import { Icon } from '../icon/Icon';
import styles from './CheckboxDropdown.module.css';

export type CheckboxRow = Readonly<{
  key: string;
  label: string;
  /** `group` rows head a section; `item` rows sit under them. */
  kind: 'group' | 'item';
}>;

type CheckboxDropdownProps = {
  /** Names the button and the list for screen readers. */
  label: string;
  /** What the button shows: the choice made, or the "all" text. */
  summary: string;
  allLabel: string;
  rows: readonly CheckboxRow[];
  selected: ReadonlySet<string>;
  onChange: (selected: ReadonlySet<string>) => void;
};

/** A select that opens a list of checkboxes, so more than one choice can be made. */
export function CheckboxDropdown({
  label,
  summary,
  allLabel,
  rows,
  selected,
  onChange,
}: CheckboxDropdownProps) {
  return (
    <DialogTrigger>
      <Button className={styles.button} aria-label={`${label}: ${summary}`}>
        <span>{summary}</span>
        <Icon name="chevron" className={styles.chevron} />
      </Button>
      <Popover className={styles.popover} offset={4}>
        <Dialog aria-label={label} className={styles.dialog}>
          <Checkbox
            className={styles.row}
            isSelected={selected.size === 0}
            onChange={() => onChange(new Set())}
          >
            <span className={styles.box}>
              <Icon name="check" className={styles.check} />
            </span>
            {allLabel}
          </Checkbox>
          <CheckboxGroup
            aria-label={label}
            className={styles.group}
            value={[...selected]}
            onChange={(keys) => onChange(new Set(keys))}
          >
            {rows.map((row) => (
              <Checkbox
                key={row.key}
                value={row.key}
                className={`${styles.row} ${row.kind === 'group' ? styles.heading : styles.item}`}
              >
                <span className={styles.box}>
                  <Icon name="check" className={styles.check} />
                </span>
                {row.label}
              </Checkbox>
            ))}
          </CheckboxGroup>
        </Dialog>
      </Popover>
    </DialogTrigger>
  );
}
