'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Form } from 'react-aria-components';
import { useForm } from 'react-hook-form';
import { Button, FormTextField } from '@/shared/ui';
import {
  changePasswordDefaults,
  changePasswordSchema,
  type ChangePasswordInput,
} from '../model/changePasswordSchema';
import styles from './ChangePasswordForm.module.css';

export function ChangePasswordForm() {
  const { control, handleSubmit, reset, formState } = useForm<ChangePasswordInput>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: changePasswordDefaults,
    mode: 'onTouched',
  });

  function onSubmit(): void {
    reset(changePasswordDefaults, { keepIsSubmitSuccessful: true });
  }

  return (
    <Form className={styles.form} onSubmit={handleSubmit(onSubmit)} validationBehavior="aria">
      <FormTextField
        control={control}
        name="currentPassword"
        type="password"
        label="Current password"
        autoComplete="current-password"
      />
      <FormTextField
        control={control}
        name="newPassword"
        type="password"
        label="New password"
        autoComplete="new-password"
        placeholder="At least 8 characters"
      />
      <Button type="submit" variant="outline" className={styles.submit}>
        Update password
      </Button>
      <p className={styles.status} role="status">
        {formState.isSubmitSuccessful && !formState.isDirty ? 'Password updated.' : ''}
      </p>
    </Form>
  );
}
