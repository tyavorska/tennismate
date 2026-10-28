import { z } from 'zod';
import { apiFetch } from '@/shared/api';

export function signOut(): Promise<undefined> {
  return apiFetch('/api/auth/sign-out', { method: 'POST', schema: z.undefined() });
}
