import 'server-only';
import { z } from 'zod';
import type { User } from '@/entities/user';
import { createUser } from '../auth';
import { db } from '../db';
import { createProfile } from '../profiles';

export function krakowId(): number {
  const row = db.prepare("SELECT id FROM cities WHERE slug = 'krakow'").get();
  return z.object({ id: z.number() }).parse(row).id;
}

/** An account with a profile, in Kraków unless another city is given. */
export async function createPlayer(email: string, cityId: number = krakowId()): Promise<User> {
  const user = await createUser({ email, password: 'serve-and-volley' });
  createProfile(user, cityId);
  return user;
}
