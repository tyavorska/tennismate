'use client';

import {
  ToggleButton,
  ToggleButtonGroup,
  type ToggleButtonGroupProps,
  type ToggleButtonProps,
} from 'react-aria-components';

type ToggleGroupProps = Omit<ToggleButtonGroupProps, 'selectionMode' | 'disallowEmptySelection'>;

/** Choose exactly one item of a row of toggle buttons. Announced as a radio group. */
export function ToggleGroup(props: ToggleGroupProps) {
  return <ToggleButtonGroup {...props} selectionMode="single" disallowEmptySelection />;
}

/** Item of a ToggleGroup. Unstyled: the caller sets the look through `className`. */
export function ToggleItem(props: ToggleButtonProps) {
  return <ToggleButton {...props} />;
}
