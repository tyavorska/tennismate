import { z } from 'zod';
import { apiFetch } from '@/shared/api';
import { openGameSchema, type NewGame, type OpenGame } from '../model/openGame';
import { apiRoutes } from '@/shared/config';

const openGamesSchema = z.array(openGameSchema);

export const openGameApi = {
  list: (): Promise<readonly OpenGame[]> => apiFetch(apiRoutes.games, { schema: openGamesSchema }),
  create: (game: NewGame): Promise<OpenGame> =>
    apiFetch(apiRoutes.games, { method: 'POST', body: game, schema: openGameSchema }),
  join: (id: string): Promise<OpenGame> =>
    apiFetch(apiRoutes.gameParticipation(id), { method: 'PUT', schema: openGameSchema }),
  leave: (id: string): Promise<OpenGame> =>
    apiFetch(apiRoutes.gameParticipation(id), { method: 'DELETE', schema: openGameSchema }),
  remove: (id: string): Promise<undefined> =>
    apiFetch(apiRoutes.game(id), { method: 'DELETE', schema: z.undefined() }),
};
