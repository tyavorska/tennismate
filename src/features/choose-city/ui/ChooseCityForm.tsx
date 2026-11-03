'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Form } from 'react-aria-components';
import { Controller, useForm } from 'react-hook-form';
import type { City } from '@/entities/city';
import { applyFieldErrors } from '@/shared/lib';
import { Button, FormAlert, SelectField, type SelectOption } from '@/shared/ui';
import {
  chooseCityDefaults,
  chooseCitySchema,
  type ChooseCityInput,
} from '../model/chooseCitySchema';
import { useChooseCity } from '../model/useChooseCity';
import styles from './ChooseCityForm.module.css';

type ChooseCityFormProps = {
  cities: readonly City[];
};

const fields = ['cityId'] as const;

export function ChooseCityForm({ cities }: ChooseCityFormProps) {
  const chooseCity = useChooseCity();
  const { control, handleSubmit, setError } = useForm<ChooseCityInput>({
    resolver: zodResolver(chooseCitySchema),
    defaultValues: chooseCityDefaults,
    mode: 'onTouched',
  });
  const options: readonly SelectOption[] = cities.map((city) => ({
    id: String(city.id),
    label: city.name,
  }));

  function onSubmit(values: ChooseCityInput): void {
    if (chooseCity.isPending) return;
    chooseCity.mutate(values, {
      onError: (error) => applyFieldErrors(error.fieldErrors, fields, setError),
    });
  }

  const formError =
    chooseCity.error !== null && chooseCity.error.kind !== 'validation'
      ? chooseCity.error
      : undefined;

  return (
    <div className={styles.root}>
      <h1 className={styles.title}>Where do you play?</h1>
      <p className={styles.lead}>
        You only see players, games and courts in your city, and they only see you.
      </p>

      <Form className={styles.form} onSubmit={handleSubmit(onSubmit)} validationBehavior="aria">
        <Controller
          control={control}
          name="cityId"
          render={({ field, fieldState }) => (
            <SelectField
              label="City"
              placeholder="Choose your city"
              options={options}
              value={field.value}
              onChange={field.onChange}
              error={fieldState.error?.message}
            />
          )}
        />

        {formError !== undefined && (
          <FormAlert referenceId={formError.kind === 'server' ? formError.requestId : undefined}>
            {formError.message}
          </FormAlert>
        )}

        <Button type="submit" variant="ball" isPending={chooseCity.isPending}>
          {chooseCity.isPending ? 'Saving…' : 'Continue'}
        </Button>
      </Form>
    </div>
  );
}
