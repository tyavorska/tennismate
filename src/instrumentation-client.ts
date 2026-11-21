import * as Sentry from '@sentry/nextjs';
import { publicEnv } from '@/shared/config';

Sentry.init({
  dsn: publicEnv.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0.1,
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
