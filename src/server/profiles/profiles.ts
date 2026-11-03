import 'server-only';
import { z } from 'zod';
import { playerSchema, type Player, type ProfileUpdate } from '@/entities/player';
import type { User } from '@/entities/user';
import { distanceKm } from '@/shared/lib';
import { requireCity } from '../cities';
import { db } from '../db';
import { DomainError } from '../http';

const defaultRating = 3;

const profileRowSchema = z.object({
  id: z.string(),
  name: z.string(),
  rating: z.number(),
  district: z.string(),
  city_id: z.number(),
  city_name: z.string(),
});

const districtRowSchema = z.object({ id: z.number(), latitude: z.number(), longitude: z.number() });

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
    city: { id: row.city_id, name: row.city_name },
  });
}

function findProfile(userId: string): Player | undefined {
  const row = db
    .prepare(
      `SELECT profiles.user_id AS id, profiles.name, profiles.rating, districts.name AS district,
              cities.id AS city_id, cities.name AS city_name
       FROM profiles
       JOIN districts ON districts.id = profiles.district_id
       JOIN cities ON cities.id = profiles.city_id
       WHERE profiles.user_id = ?`,
    )
    .get(userId);
  return row && toPlayer(profileRowSchema.parse(row));
}

/** The district closest to the middle of the city, where a new player starts until they pick one. */
function centralDistrictId(cityId: number): number {
  const city = z
    .object({ latitude: z.number(), longitude: z.number() })
    .parse(db.prepare('SELECT latitude, longitude FROM cities WHERE id = ?').get(cityId));
  const districts = z
    .array(districtRowSchema)
    .parse(
      db.prepare('SELECT id, latitude, longitude FROM districts WHERE city_id = ?').all(cityId),
    );

  const [closest] = districts.toSorted((a, b) => distanceKm(city, a) - distanceKm(city, b));
  if (closest === undefined) throw new Error(`City ${cityId} has no districts`);
  return closest.id;
}

/** The user's profile, or nothing when they have not chosen a city yet. */
export function getProfile(user: User): Player | undefined {
  return findProfile(user.id);
}

/** For code that only makes sense with a city. Without a profile the player must choose one first. */
export function requireProfile(user: User): Player {
  const profile = findProfile(user.id);
  if (profile === undefined) {
    throw new DomainError('forbidden', { message: 'Choose your city to continue.' });
  }
  return profile;
}

/** Starts the player in a city, in the district nearest its middle until they pick their own. */
export function createProfile(user: User, cityId: number): Player {
  requireCity(cityId);

  const now = new Date().toISOString();
  const { changes } = db
    .prepare(
      `INSERT OR IGNORE INTO profiles
         (user_id, name, city_id, district_id, rating, formats, times, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, '["singles","doubles"]', '[]', ?, ?)`,
    )
    .run(
      user.id,
      nameFromEmail(user.email),
      cityId,
      centralDistrictId(cityId),
      defaultRating,
      now,
      now,
    );
  if (changes === 0) throw new DomainError('conflict', { message: 'You already chose a city.' });

  return requireProfile(user);
}

/** Changes the name, district and level. The district has to be in the player's own city. */
export function updateProfile(user: User, update: ProfileUpdate): Player {
  const profile = requireProfile(user);
  const district = db
    .prepare('SELECT id FROM districts WHERE city_id = ? AND name = ?')
    .get(profile.city.id, update.neighborhood);
  if (district === undefined) {
    throw new DomainError('validation', {
      fieldErrors: { neighborhood: 'Choose a district from the list.' },
    });
  }

  db.prepare(
    'UPDATE profiles SET name = ?, district_id = ?, rating = ?, updated_at = ? WHERE user_id = ?',
  ).run(
    update.name,
    z.number().parse(district.id),
    update.rating,
    new Date().toISOString(),
    user.id,
  );

  const updated = findProfile(user.id);
  if (updated === undefined) throw new Error('Profile disappeared during update');
  return updated;
}
