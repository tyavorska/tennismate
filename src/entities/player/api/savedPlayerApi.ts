import { z } from 'zod';
import { apiFetch } from '@/shared/api';

export const savedPlayerApi = {
  list: (): Promise<readonly string[]> =>
    apiFetch('/api/me/saved-players', { schema: z.array(z.string()) }),
  save: (id: string): Promise<undefined> =>
    apiFetch(`/api/me/saved-players/${id}`, { method: 'PUT', schema: z.undefined() }),
  remove: (id: string): Promise<undefined> =>
    apiFetch(`/api/me/saved-players/${id}`, { method: 'DELETE', schema: z.undefined() }),
};
