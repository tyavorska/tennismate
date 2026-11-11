import { errorPolicy, toApiError } from './errors';

export const defaultMaxRetries = 3;

/** Retries only the kinds that are safe and useful to repeat, and only a few times. */
export function shouldRetry(
  failureCount: number,
  error: Error,
  maxRetries: number = defaultMaxRetries,
): boolean {
  return failureCount < maxRetries && errorPolicy[toApiError(error).kind].retryable;
}

/** Waits what the server asked for, otherwise 1 s, 2 s, 4 s. */
export function retryDelay(attempt: number, error: Error): number {
  const retryAfterSeconds = toApiError(error).retryAfterSeconds;
  return retryAfterSeconds === undefined ? 1000 * 2 ** attempt : retryAfterSeconds * 1000;
}
