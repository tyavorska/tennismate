import { playerSchema, type Player, type ProfileUpdate } from '@/entities/player';
import { apiFetch } from '@/shared/api';
import { apiRoutes } from '@/shared/config';

export function updateProfile(update: ProfileUpdate): Promise<Player> {
  return apiFetch(apiRoutes.me, { method: 'PATCH', body: update, schema: playerSchema });
}
