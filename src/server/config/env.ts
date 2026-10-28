import 'server-only';
import { z } from 'zod';

const serverEnvSchema = z.object({
  DATABASE_PATH: z.string().min(1).default('data/tennismate.db'),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
});

export const serverEnv = serverEnvSchema.parse(process.env);
