import 'server-only';
import type { ErrorKind } from '@/shared/api';

type DomainErrorOptions = Readonly<{
  message?: string;
  fieldErrors?: Record<string, string>;
}>;

/** A failure the client can act on. Business code throws it; the route handler turns it into a response. */
export class DomainError extends Error {
  readonly kind: ErrorKind;
  readonly publicMessage: string | undefined;
  readonly fieldErrors: Record<string, string> | undefined;

  constructor(kind: ErrorKind, { message, fieldErrors }: DomainErrorOptions = {}) {
    super(message ?? kind);
    this.name = 'DomainError';
    this.kind = kind;
    this.publicMessage = message;
    this.fieldErrors = fieldErrors;
  }
}
