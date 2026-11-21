import 'server-only';
import * as Sentry from '@sentry/node';
import { publicEnv } from '@/shared/config';

export const monitoringOptions = {
  dsn: publicEnv.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0.1,
} as const satisfies Sentry.NodeOptions;

/** For the realtime process. Next starts Sentry itself in `instrumentation.ts`. */
export function initMonitoring(): void {
  Sentry.init(monitoringOptions);
}
