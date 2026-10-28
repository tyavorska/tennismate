'use client';

import type { Ref } from 'react';
import {
  FieldError,
  Input,
  Label,
  Text,
  TextField as AriaTextField,
  type TextFieldProps as AriaTextFieldProps,
} from 'react-aria-components';
import styles from './TextField.module.css';

export type TextFieldProps = Omit<AriaTextFieldProps, 'className' | 'children'> & {
  label: string;
  description?: string;
  placeholder?: string;
  errorMessage?: string;
  inputRef?: Ref<HTMLInputElement>;
};

export function TextField({
  label,
  description,
  placeholder,
  errorMessage,
  inputRef,
  ...props
}: TextFieldProps) {
  return (
    <AriaTextField
      {...props}
      isInvalid={props.isInvalid ?? Boolean(errorMessage)}
      validationBehavior="aria"
      className={styles.field}
    >
      <Label className={styles.label}>{label}</Label>
      <Input ref={inputRef} className={styles.input} placeholder={placeholder} />
      {description && (
        <Text slot="description" className={styles.description}>
          {description}
        </Text>
      )}
      <FieldError className={styles.error}>{errorMessage}</FieldError>
    </AriaTextField>
  );
}
