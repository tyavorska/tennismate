import 'server-only';
import { z } from 'zod';
import { playerSchema, type Player, type ProfileUpdate } from '@/entities/player';
import type { User } from '@/entities/user';
import { db } from '../db';
import { DomainError } from '../http';

const defaultDistrict = 'Stare Miasto';
const defaultRating = 3;

const profileRowSchema = z.object({
  id: z.string(),
  name: z.string(),
  rating: z.number(),
  district: z.string(),
});

/** "ana.smith@example.com" becomes "Ana Smith". */
function nameFromEmail(email: string): string {
  const localPart = email.split('@')[0] ?? email;
  return localPart
    .split(/[._+-]+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function toPlayer(row: z.infer<typeof profileRowSchema>): Player {
  return playerSchema.parse({
    id: row.id,
    name: row.name,
    rating: row.rating,
    neighborhood: row.district,
  });
}

function findProfile(userId: string): Player | undefined {
  const row = db
    .prepare('SELECT user_id AS id, name, rating, district FROM profiles WHERE user_id = ?')
    .get(userId);
  return row && toPlayer(profileRowSchema.parse(row));
}

/** The user's profile. Accounts made before profiles existed get a starter one on first use. */
export function ensureProfile(user: User): Player {
  const existing = findProfile(user.id);
  if (existing !== undefined) return existing;

  const now = new Date().toISOString();
  db.prepare(
    `INSERT OR IGNORE INTO profiles
       (user_id, name, district, rating, formats, times, created_at, updated_at)
     VALUES (?, ?, ?, ?, '["singles","doubles"]', '[]', ?, ?)`,
  ).run(user.id, nameFromEmail(user.email), defaultDistrict, defaultRating, now, now);

  const created = findProfile(user.id);
  if (created === undefined) throw new Error('Profile was not created');
  return created;
}

export function updateProfile(user: User, update: ProfileUpdate): Player {
  const district = db
    .prepare('SELECT 1 AS found FROM districts WHERE name = ?')
    .get(update.neighborhood);
  if (district === undefined) {
    throw new DomainError('validation', {
      fieldErrors: { neighborhood: 'Choose a district from the list.' },
    });
  }

  ensureProfile(user);
  db.prepare(
    'UPDATE profiles SET name = ?, district = ?, rating = ?, updated_at = ? WHERE user_id = ?',
  ).run(update.name, update.neighborhood, update.rating, new Date().toISOString(), user.id);

  const updated = findProfile(user.id);
  if (updated === undefined) throw new Error('Profile disappeared during update');
  return updated;
}
