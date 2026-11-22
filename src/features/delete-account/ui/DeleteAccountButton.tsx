'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { Form } from 'react-aria-components';
import { useForm } from 'react-hook-form';
import { applyFieldErrors } from '@/shared/lib';
import { Button, FormAlert, FormTextField, Modal } from '@/shared/ui';
import {
  deleteAccountDefaults,
  deleteAccountSchema,
  type DeleteAccountInput,
} from '../model/deleteAccountSchema';
import { useDeleteAccount } from '../model/useDeleteAccount';
import styles from './DeleteAccountButton.module.css';

const fields = ['password'] as const;

export function DeleteAccountButton() {
  const [isOpen, setIsOpen] = useState(false);
  const mutation = useDeleteAccount();
  const { control, handleSubmit, setError, reset } = useForm<DeleteAccountInput>({
    resolver: zodResolver(deleteAccountSchema),
    defaultValues: deleteAccountDefaults,
    mode: 'onTouched',
  });

  function onOpenChange(open: boolean): void {
    // Closing while the request runs would hide the outcome of an irreversible action.
    if (mutation.isPending) return;
    setIsOpen(open);
    if (!open) {
      reset(deleteAccountDefaults);
      mutation.reset();
    }
  }

  function onSubmit(values: DeleteAccountInput): void {
    if (mutation.isPending) return;
    mutation.mutate(values, {
      onError: (error) => applyFieldErrors(error.fieldErrors, fields, setError),
    });
  }

  const formError =
    mutation.error !== null && mutation.error.kind !== 'validation' ? mutation.error : undefined;

  return (
    <>
      <Button variant="outline" className={styles.danger} onPress={() => setIsOpen(true)}>
        Delete account
      </Button>
      <Modal
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        eyebrow="Account"
        title="Delete your account?"
        size="narrow"
      >
        <Form className={styles.form} onSubmit={handleSubmit(onSubmit)} validationBehavior="aria">
          <p className={styles.warning}>
            This permanently removes your profile, saved players, games you host and your place in
            other games. Your conversations stay for the other players, who will see a deleted
            account and cannot message you. It cannot be undone.
          </p>
          <FormTextField
            control={control}
            name="password"
            type="password"
            label="Confirm with your password"
            autoComplete="current-password"
          />
          {formError !== undefined && <FormAlert>{formError.message}</FormAlert>}
          <div className={styles.actions}>
            <Button
              variant="outline"
              isDisabled={mutation.isPending}
              onPress={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="outline"
              className={styles.danger}
              isPending={mutation.isPending}
            >
              {mutation.isPending ? 'Deleting…' : 'Delete my account'}
            </Button>
          </div>
        </Form>
      </Modal>
    </>
  );
}
