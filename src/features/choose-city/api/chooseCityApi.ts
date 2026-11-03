import { playerSchema, type NewProfile, type Player } from '@/entities/player';
import { apiFetch } from '@/shared/api';

export function chooseCity(profile: NewProfile): Promise<Player> {
  return apiFetch('/api/me/profile', { method: 'POST', body: profile, schema: playerSchema });
}
