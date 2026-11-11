import 'server-only';
import { z } from 'zod';

const serverEnvSchema = z.object({
  DATABASE_PATH: z.string().min(1).default('data/tennismate.db'),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  REALTIME_PORT: z.coerce.number().int().positive().default(4000),
  /** The web app's origin. The realtime server accepts browser connections only from it. */
  REALTIME_ALLOWED_ORIGIN: z.url().default('http://localhost:3000'),
});

export const serverEnv = serverEnvSchema.parse(process.env);
