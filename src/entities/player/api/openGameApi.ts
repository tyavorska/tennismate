import { z } from 'zod';
import { apiFetch } from '@/shared/api';
import { openGameSchema, type NewGame, type OpenGame } from '../model/openGame';

const openGamesSchema = z.array(openGameSchema);

export const openGameApi = {
  list: (): Promise<readonly OpenGame[]> => apiFetch('/api/games', { schema: openGamesSchema }),
  create: (game: NewGame): Promise<OpenGame> =>
    apiFetch('/api/games', { method: 'POST', body: game, schema: openGameSchema }),
  join: (id: string): Promise<OpenGame> =>
    apiFetch(`/api/games/${id}/participation`, { method: 'PUT', schema: openGameSchema }),
  leave: (id: string): Promise<OpenGame> =>
    apiFetch(`/api/games/${id}/participation`, { method: 'DELETE', schema: openGameSchema }),
  remove: (id: string): Promise<undefined> =>
    apiFetch(`/api/games/${id}`, { method: 'DELETE', schema: z.undefined() }),
};
