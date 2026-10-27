'use client';

import { useController, type Control, type FieldPath, type FieldValues } from 'react-hook-form';
import { TextField, type TextFieldProps } from './TextField';

type FormTextFieldProps<TValues extends FieldValues> = Omit<
  TextFieldProps,
  'name' | 'value' | 'onChange' | 'onBlur' | 'errorMessage' | 'inputRef'
> & {
  name: FieldPath<TValues>;
  control: Control<TValues>;
};

/** TextField bound to a react-hook-form field: value, touch state, errors and focus-on-error. */
export function FormTextField<TValues extends FieldValues>({
  name,
  control,
  ...props
}: FormTextFieldProps<TValues>) {
  const { field, fieldState } = useController({ name, control });

  return (
    <TextField
      {...props}
      name={field.name}
      value={field.value ?? ''}
      onChange={field.onChange}
      onBlur={field.onBlur}
      inputRef={field.ref}
      isDisabled={props.isDisabled ?? field.disabled}
      errorMessage={fieldState.error?.message}
    />
  );
}
