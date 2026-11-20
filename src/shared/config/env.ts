import { z } from 'zod';

const publicEnvSchema = z.object({
  NEXT_PUBLIC_REALTIME_URL: z.url().default('http://localhost:4000'),
  /** Sentry project address. Public by design. Leave it out and error reporting stays off. */
  NEXT_PUBLIC_SENTRY_DSN: z.url().optional(),
});

// Next inlines `process.env.NEXT_PUBLIC_*` only when it is written out in full.
export const publicEnv = publicEnvSchema.parse({
  NEXT_PUBLIC_REALTIME_URL: process.env.NEXT_PUBLIC_REALTIME_URL,
  // An empty value (an unset CI variable) means "off", not an invalid URL.
  NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN || undefined,
});
