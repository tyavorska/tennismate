import { playerSchema, type NewProfile, type Player } from '@/entities/player';
import { apiFetch } from '@/shared/api';
import { apiRoutes } from '@/shared/config';

export function chooseCity(profile: NewProfile): Promise<Player> {
  return apiFetch(apiRoutes.myProfile, { method: 'POST', body: profile, schema: playerSchema });
}
