import { z } from 'zod';

const publicEnvSchema = z.object({
  NEXT_PUBLIC_REALTIME_URL: z.url().default('http://localhost:4000'),
});

// Next inlines `process.env.NEXT_PUBLIC_*` only when it is written out in full.
export const publicEnv = publicEnvSchema.parse({
  NEXT_PUBLIC_REALTIME_URL: process.env.NEXT_PUBLIC_REALTIME_URL,
});
