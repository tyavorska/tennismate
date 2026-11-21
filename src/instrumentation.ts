import * as Sentry from '@sentry/nextjs';

export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME !== 'nodejs') return;
  const { monitoringOptions } = await import('@/server/monitoring');
  Sentry.init(monitoringOptions);
}

// Reports errors that Next catches itself (a Server Component that throws). Handlers that catch
// their own errors go through `reportError` instead.
export const onRequestError = Sentry.captureRequestError;
