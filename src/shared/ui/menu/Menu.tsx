'use client';

import type { ReactNode } from 'react';
import {
  Button as AriaButton,
  Menu as AriaMenu,
  MenuItem as AriaMenuItem,
  MenuTrigger,
  Popover,
  Separator,
  type MenuItemProps as AriaMenuItemProps,
} from 'react-aria-components';
import styles from './Menu.module.css';

type MenuProps = {
  /** Content of the button that opens the menu. It names both the button and the menu. */
  trigger: ReactNode;
  triggerClassName?: string;
  children: ReactNode;
};

/** Dropdown menu: Enter, Space or arrow keys open it, Esc closes it and focus returns. */
export function Menu({ trigger, triggerClassName, children }: MenuProps) {
  const triggerClasses = [styles.trigger, triggerClassName].filter(Boolean).join(' ');

  return (
    <MenuTrigger>
      <AriaButton className={triggerClasses}>{trigger}</AriaButton>
      <Popover className={styles.popover} placement="bottom end" offset={8}>
        <AriaMenu className={styles.menu}>{children}</AriaMenu>
      </Popover>
    </MenuTrigger>
  );
}

type MenuItemProps = Omit<AriaMenuItemProps, 'className' | 'children'> & {
  children: ReactNode;
};

export function MenuItem({ children, ...props }: MenuItemProps) {
  return (
    <AriaMenuItem {...props} className={styles.item}>
      {children}
    </AriaMenuItem>
  );
}

export function MenuSeparator() {
  return <Separator className={styles.separator} />;
}
