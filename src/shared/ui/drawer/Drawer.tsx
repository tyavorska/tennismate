'use client';

import { useRouter } from 'next/navigation';
import type { ReactNode } from 'react';
import { Dialog, Modal, ModalOverlay } from 'react-aria-components';
import { Button } from '../button/Button';
import styles from './Drawer.module.css';

type DrawerProps = {
  label: string;
  children: ReactNode;
};

/** Side panel for intercepted routes: closing navigates back to the underlying page. */
export function Drawer({ label, children }: DrawerProps) {
  const router = useRouter();

  return (
    <ModalOverlay
      className={styles.overlay}
      isOpen
      onOpenChange={(isOpen) => {
        if (!isOpen) {
          router.back();
        }
      }}
    >
      <Modal className={styles.drawer}>
        <Dialog className={styles.panel} aria-label={label}>
          <Button variant="ghost" slot="close" className={styles.close} aria-label="Close">
            x
          </Button>
          {children}
        </Dialog>
      </Modal>
    </ModalOverlay>
  );
}
