import { z } from 'zod';
import { emailSchema, passwordSchema } from '@/entities/user';

export const signUpSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

export type SignUpInput = z.input<typeof signUpSchema>;

export const signUpDefaults = { email: '', password: '' } satisfies SignUpInput;
