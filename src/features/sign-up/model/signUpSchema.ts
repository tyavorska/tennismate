import { z } from 'zod';
import { emailSchema, passwordSchema } from '@/entities/user';

export const signUpSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  /** The id of the chosen city as the select gives it: text, empty until one is chosen. */
  cityId: z.string().min(1, 'Choose your city'),
});

export type SignUpInput = z.input<typeof signUpSchema>;

export const signUpDefaults = { email: '', password: '', cityId: '' } satisfies SignUpInput;
