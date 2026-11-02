'use client';

import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form } from 'react-aria-components';
import { Controller, useForm } from 'react-hook-form';
import type { Player } from '@/entities/player';
import { Button, FormTextField, SelectField, type SelectOption } from '@/shared/ui';
import {
  editProfileDefaults,
  editProfileSchema,
  type EditProfileInput,
} from '../model/editProfileSchema';
import styles from './EditProfileForm.module.css';

type EditProfileFormProps = {
  viewer: Player;
};

const ratingOptions: readonly SelectOption[] = Array.from({ length: 13 }, (_, step) => {
  const rating = 1 + step * 0.5;
  return { id: String(rating), label: rating.toFixed(1) };
});

export function EditProfileForm({ viewer }: EditProfileFormProps) {
  const [saved, setSaved] = useState(false);
  const { control, handleSubmit, reset, formState } = useForm<EditProfileInput>({
    resolver: zodResolver(editProfileSchema),
    defaultValues: editProfileDefaults(viewer),
    mode: 'onTouched',
  });

  function onSubmit(values: EditProfileInput): void {
    reset(values);
    setSaved(true);
  }

  return (
    <Form className={styles.form} onSubmit={handleSubmit(onSubmit)} validationBehavior="aria">
      <FormTextField control={control} name="name" label="Name" autoComplete="name" />
      <FormTextField control={control} name="neighborhood" label="Home district" />
      <Controller
        control={control}
        name="rating"
        render={({ field }) => (
          <SelectField
            label="Level (NTRP)"
            options={ratingOptions}
            value={String(field.value)}
            onChange={(id) => {
              field.onChange(Number(id));
            }}
          />
        )}
      />

      <Button type="submit" variant="solid" className={styles.submit}>
        Save changes
      </Button>

      <p className={styles.status} role="status">
        {saved && !formState.isDirty ? 'Changes saved.' : ''}
      </p>
    </Form>
  );
}
