import { z } from 'zod';

export const emailSchema = z
  .email('Enter a valid email address')
  .transform((email) => email.trim().toLowerCase());

export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password must be at most 128 characters');

export const credentialsSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

export type Credentials = z.infer<typeof credentialsSchema>;

// Sign-in only requires a password; the length rules apply when one is created.
export const signInCredentialsSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Enter your password').max(128, 'Password is too long'),
});

export const userIdSchema = z.uuid().brand<'UserId'>();
export type UserId = z.infer<typeof userIdSchema>;

export const userSchema = z.object({
  id: userIdSchema,
  email: z.email(),
});

export type User = z.infer<typeof userSchema>;
