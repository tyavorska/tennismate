import { z } from 'zod';
import { apiFetch } from '@/shared/api';
import { apiRoutes } from '@/shared/config';

export function signOut(): Promise<undefined> {
  return apiFetch(apiRoutes.signOut, { method: 'POST', schema: z.undefined() });
}
