'use client';

import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form } from 'react-aria-components';
import { Controller, useForm } from 'react-hook-form';
import type { Player } from '@/entities/player';
import { applyFieldErrors, messagesForFields } from '@/shared/lib';
import { Button, FormAlert, FormTextField, SelectField, type SelectOption } from '@/shared/ui';
import {
  editProfileDefaults,
  editProfileSchema,
  type EditProfileInput,
} from '../model/editProfileSchema';
import { useUpdateProfile } from '../model/useUpdateProfile';
import styles from './EditProfileForm.module.css';

type EditProfileFormProps = {
  viewer: Player;
  districts: readonly string[];
};

const fields = ['name', 'neighborhood', 'rating'] as const;
// The selects cannot show an error themselves, so their messages go in the alert above the button.
const selectFields = ['neighborhood', 'rating'] as const;

const ratingOptions: readonly SelectOption[] = Array.from({ length: 13 }, (_, step) => {
  const rating = 1 + step * 0.5;
  return { id: String(rating), label: rating.toFixed(1) };
});

export function EditProfileForm({ viewer, districts }: EditProfileFormProps) {
  const [saved, setSaved] = useState(false);
  const updateProfile = useUpdateProfile();
  const { control, handleSubmit, reset, setError, formState } = useForm<EditProfileInput>({
    resolver: zodResolver(editProfileSchema),
    defaultValues: editProfileDefaults(viewer),
    mode: 'onTouched',
  });

  const districtOptions: readonly SelectOption[] = districts.map((name) => ({
    id: name,
    label: name,
  }));

  function onSubmit(values: EditProfileInput): void {
    if (updateProfile.isPending) return;
    const parsed = editProfileSchema.safeParse(values);
    if (!parsed.success) return;
    setSaved(false);
    updateProfile.mutate(parsed.data, {
      onSuccess: () => {
        reset(values);
        setSaved(true);
      },
      onError: (error) => applyFieldErrors(error.fieldErrors, fields, setError),
    });
  }

  const error = updateProfile.error;
  const formMessage =
    error === null
      ? ''
      : error.kind === 'validation'
        ? messagesForFields(error.fieldErrors, selectFields)
        : `${error.message} Your changes were not saved.`;

  return (
    <Form className={styles.form} onSubmit={handleSubmit(onSubmit)} validationBehavior="aria">
      <FormTextField control={control} name="name" label="Name" autoComplete="name" />
      <Controller
        control={control}
        name="neighborhood"
        render={({ field }) => (
          <SelectField
            label="Home district"
            options={districtOptions}
            value={field.value}
            onChange={field.onChange}
          />
        )}
      />
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

      {error !== null && formMessage !== '' && (
        <FormAlert referenceId={error.kind === 'server' ? error.requestId : undefined}>
          {formMessage}
        </FormAlert>
      )}

      <Button
        type="submit"
        variant="solid"
        className={styles.submit}
        isPending={updateProfile.isPending}
      >
        {updateProfile.isPending ? 'Saving…' : 'Save changes'}
      </Button>

      <p className={styles.status} role="status">
        {saved && !formState.isDirty ? 'Changes saved.' : ''}
      </p>
    </Form>
  );
}
