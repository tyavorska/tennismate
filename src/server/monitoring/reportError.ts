import 'server-only';
import * as Sentry from '@sentry/node';

/** Sends an unexpected failure to Sentry. The request id ties the event to the player's report. */
export function reportError(error: Error | string, operation: string, requestId: string): void {
  Sentry.captureException(error instanceof Error ? error : new Error(error), {
    tags: { operation },
    extra: { requestId },
  });
}
