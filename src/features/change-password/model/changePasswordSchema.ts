import { z } from 'zod';
import { passwordSchema } from '@/entities/user';

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Enter your current password'),
  newPassword: passwordSchema,
});

export type ChangePasswordInput = z.input<typeof changePasswordSchema>;

export const changePasswordDefaults = {
  currentPassword: '',
  newPassword: '',
} satisfies ChangePasswordInput;
