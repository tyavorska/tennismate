import { z } from 'zod';
import type { DeleteAccountRequest } from '@/entities/user';
import { apiFetch } from '@/shared/api';
import { apiRoutes } from '@/shared/config';

export function deleteAccount(request: DeleteAccountRequest): Promise<undefined> {
  return apiFetch(apiRoutes.me, { method: 'DELETE', body: request, schema: z.undefined() });
}
