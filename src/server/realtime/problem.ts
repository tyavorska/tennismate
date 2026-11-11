import 'server-only';
import { randomUUID } from 'node:crypto';
import { errorPolicy, type Problem } from '@/shared/api';
import { DomainError } from '../http';

/**
 * The answer for a failed event. A domain error is expected and passes through. Anything else is
 * logged with a request id the player can quote, and answers a generic problem with no internals.
 */
export function toProblem(error: Error | string, operation: string): Problem {
  if (error instanceof DomainError) {
    return { kind: error.kind, message: error.publicMessage, fieldErrors: error.fieldErrors };
  }
  const requestId = randomUUID();
  console.error(
    JSON.stringify({
      level: 'error',
      kind: 'server',
      operation,
      status: errorPolicy.server.status,
      requestId,
      timestamp: new Date().toISOString(),
      detail: error instanceof Error ? error.message : error,
    }),
  );
  return { kind: 'server', requestId };
}
