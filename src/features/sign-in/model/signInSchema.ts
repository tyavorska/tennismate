import type { z } from 'zod';
import { signInCredentialsSchema } from '@/entities/user';

export const signInSchema = signInCredentialsSchema;

export type SignInInput = z.input<typeof signInSchema>;

export const signInDefaults = { email: '', password: '' } satisfies SignInInput;
