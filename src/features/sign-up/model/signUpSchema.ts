import { z } from 'zod';

export const signUpSchema = z
  .object({
    email: z.email('Enter a valid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string().min(1, 'Confirm your password'),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export type SignUpInput = z.infer<typeof signUpSchema>;

export const signUpDefaults = {
  email: '',
  password: '',
  confirmPassword: '',
} satisfies SignUpInput;
