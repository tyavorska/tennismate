import { playerSchema, type Player, type ProfileUpdate } from '@/entities/player';
import { apiFetch } from '@/shared/api';

export function updateProfile(update: ProfileUpdate): Promise<Player> {
  return apiFetch('/api/me', { method: 'PATCH', body: update, schema: playerSchema });
}
