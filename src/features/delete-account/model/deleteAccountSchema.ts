import type { z } from 'zod';
import { deleteAccountRequestSchema } from '@/entities/user';

export const deleteAccountSchema = deleteAccountRequestSchema;

export type DeleteAccountInput = z.input<typeof deleteAccountSchema>;

export const deleteAccountDefaults = { password: '' } satisfies DeleteAccountInput;
