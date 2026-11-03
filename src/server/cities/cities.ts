import 'server-only';
import { z } from 'zod';
import { citySchema, type City } from '@/entities/city';
import { db } from '../db';

export function listCities(): readonly City[] {
  const rows = db.prepare('SELECT id, slug, name, country FROM cities').all();
  return z
    .array(citySchema)
    .parse(rows)
    .toSorted((a, b) => a.name.localeCompare(b.name, 'pl'));
}

/** The id of the city a new account starts in until sign-up asks for one. */
export function defaultCityId(): number {
  const row = db.prepare('SELECT id FROM cities ORDER BY id LIMIT 1').get();
  return z.object({ id: z.number() }).parse(row).id;
}
