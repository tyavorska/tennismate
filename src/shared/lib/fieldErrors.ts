import type { FieldPath, FieldValues, UseFormSetError } from 'react-hook-form';

export function applyFieldErrors<TValues extends FieldValues>(
  fieldErrors: Readonly<Record<string, string>>,
  fields: ReadonlyArray<FieldPath<TValues>>,
  setError: UseFormSetError<TValues>,
): void {
  const matching = fields.filter((field) => fieldErrors[field] !== undefined);
  matching.forEach((field, index) =>
    setError(field, { message: fieldErrors[field] }, { shouldFocus: index === 0 }),
  );
}

/** The server's text for fields that have no place to show their own error, such as selects. */
export function messagesForFields(
  fieldErrors: Readonly<Record<string, string>>,
  fields: readonly string[],
): string {
  return fields
    .map((field) => fieldErrors[field])
    .filter((message) => message !== undefined)
    .join(' ');
}
