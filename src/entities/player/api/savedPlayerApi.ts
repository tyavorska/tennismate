import { z } from 'zod';
import { apiFetch } from '@/shared/api';
import { apiRoutes } from '@/shared/config';

export const savedPlayerApi = {
  list: (): Promise<readonly string[]> =>
    apiFetch(apiRoutes.savedPlayers, { schema: z.array(z.string()) }),
  save: (id: string): Promise<undefined> =>
    apiFetch(apiRoutes.savedPlayer(id), { method: 'PUT', schema: z.undefined() }),
  remove: (id: string): Promise<undefined> =>
    apiFetch(apiRoutes.savedPlayer(id), { method: 'DELETE', schema: z.undefined() }),
};
