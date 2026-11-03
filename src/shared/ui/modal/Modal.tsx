'use client';

import type { ReactNode } from 'react';
import { Dialog, Heading, Modal as AriaModal, ModalOverlay } from 'react-aria-components';
import { Button } from '../button/Button';
import { Eyebrow } from '../eyebrow/Eyebrow';
import { Icon } from '../icon/Icon';
import styles from './Modal.module.css';

type ModalProps = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  eyebrow?: string;
  title: string;
  /** Keeps the title for screen readers only, when the content shows its own headline. */
  hideTitle?: boolean;
  /** Content between the eyebrow and the title, such as a progress bar. */
  meta?: ReactNode;
  size?: 'default' | 'narrow';
  children: ReactNode;
};

/** Dialog over a dimmed page. Traps focus, closes on Esc and returns focus to the trigger. */
export function Modal({
  isOpen,
  onOpenChange,
  eyebrow,
  title,
  hideTitle = false,
  meta,
  size = 'default',
  children,
}: ModalProps) {
  return (
    <ModalOverlay
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      isDismissable
      className={styles.overlay}
    >
      <AriaModal
        className={[styles.modal, size === 'narrow' ? styles.narrow : ''].filter(Boolean).join(' ')}
      >
        <Dialog className={styles.dialog}>
          {({ close }) => (
            <>
              <header className={styles.header}>
                {eyebrow !== undefined && <Eyebrow>{eyebrow}</Eyebrow>}
                {meta}
                <Heading slot="title" className={hideTitle ? styles.hidden : styles.title}>
                  {title}
                </Heading>
                <Button
                  variant="outline"
                  className={styles.close}
                  onPress={close}
                  aria-label="Close"
                >
                  <Icon name="close" />
                </Button>
              </header>
              {children}
            </>
          )}
        </Dialog>
      </AriaModal>
    </ModalOverlay>
  );
}
