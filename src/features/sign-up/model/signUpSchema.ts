import { z } from 'zod';
import { emailSchema, passwordSchema } from '@/entities/user';

export const signUpSchema = z
  .object({
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string().min(1, 'Confirm your password'),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export type SignUpInput = z.input<typeof signUpSchema>;

export const signUpDefaults = {
  email: '',
  password: '',
  confirmPassword: '',
} satisfies SignUpInput;
