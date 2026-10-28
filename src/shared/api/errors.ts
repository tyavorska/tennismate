import { z } from 'zod';

export const errorKindSchema = z.enum([
  'network',
  'unavailable',
  'server',
  'validation',
  'unauthenticated',
  'forbidden',
  'notFound',
  'conflict',
  'rateLimited',
  'malformed',
  'unexpected',
]);
export type ErrorKind = z.infer<typeof errorKindSchema>;

type ErrorPolicy = Readonly<{ status: number; retryable: boolean; message: string }>;

export const errorPolicy = {
  network: {
    status: 0,
    retryable: true,
    message: "We couldn't reach the server. Your changes are still here.",
  },
  unavailable: {
    status: 503,
    retryable: true,
    message: 'The service is temporarily unavailable.',
  },
  server: {
    status: 500,
    retryable: false,
    message: 'Something went wrong on our side. Please try again.',
  },
  validation: { status: 422, retryable: false, message: 'Some fields need attention.' },
  unauthenticated: {
    status: 401,
    retryable: false,
    message: 'Your session has expired. Sign in again to continue.',
  },
  forbidden: { status: 403, retryable: false, message: "You don't have permission to do this." },
  notFound: { status: 404, retryable: false, message: 'This item no longer exists.' },
  conflict: {
    status: 409,
    retryable: false,
    message: 'This item was changed by someone else.',
  },
  rateLimited: {
    status: 429,
    retryable: true,
    message: 'Too many requests. Trying again shortly.',
  },
  malformed: { status: 502, retryable: false, message: 'We received unexpected data.' },
  unexpected: { status: 500, retryable: false, message: 'Something went wrong.' },
} as const satisfies Record<ErrorKind, ErrorPolicy>;

export const problemSchema = z.object({
  kind: errorKindSchema,
  /** Overrides the kind's generic message. */
  message: z.string().optional(),
  fieldErrors: z.record(z.string(), z.string()).optional(),
  requestId: z.string().optional(),
});

export type Problem = z.infer<typeof problemSchema>;

export class ApiError extends Error {
  readonly kind: ErrorKind;
  readonly fieldErrors: Readonly<Record<string, string>>;
  readonly requestId: string | undefined;
  readonly retryAfterSeconds: number | undefined;

  constructor(problem: Problem, retryAfterSeconds?: number) {
    super(problem.message ?? errorPolicy[problem.kind].message);
    this.name = 'ApiError';
    this.kind = problem.kind;
    this.fieldErrors = problem.fieldErrors ?? {};
    this.requestId = problem.requestId;
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

export function toApiError(error: Error | ApiError): ApiError {
  if (error instanceof ApiError) return error;
  return new ApiError({ kind: 'unexpected' });
}
