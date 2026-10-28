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
