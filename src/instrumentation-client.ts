import * as Sentry from '@sentry/nextjs';
import { noRequestData, publicEnv } from '@/shared/config';

Sentry.init({
  dsn: publicEnv.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0.1,
  dataCollection: noRequestData,
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
