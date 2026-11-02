'use client';

import type { ReactNode } from 'react';
import { Dialog, Modal as AriaModal, ModalOverlay } from 'react-aria-components';
import styles from './Drawer.module.css';

type DrawerProps = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  /** Accessible name of the panel. */
  label: string;
  children: (close: () => void) => ReactNode;
};

/** Panel that slides in from the right over a dimmed page. Traps focus, closes on Esc. */
export function Drawer({ isOpen, onOpenChange, label, children }: DrawerProps) {
  return (
    <ModalOverlay
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      isDismissable
      className={styles.overlay}
    >
      <AriaModal className={styles.panel}>
        <Dialog aria-label={label} className={styles.dialog}>
          {({ close }) => children(close)}
        </Dialog>
      </AriaModal>
    </ModalOverlay>
  );
}
