import 'server-only';
import { z } from 'zod';
import { citySchema, type City } from '@/entities/city';
import { db } from '../db';
import { DomainError } from '../http';

// A city is open when it has at least one court that is still listed.
const openCity = `EXISTS (SELECT 1 FROM courts WHERE courts.city_id = cities.id AND courts.removed_at IS NULL)`;

/** The cities a player can choose: the ones with a court to play on. */
export function listCities(): readonly City[] {
  const rows = db.prepare(`SELECT id, slug, name, country FROM cities WHERE ${openCity}`).all();
  return z
    .array(citySchema)
    .parse(rows)
    .toSorted((a, b) => a.name.localeCompare(b.name, 'pl'));
}

/** Throws a `validation` error for the `cityId` field when the city does not exist or is not open. */
export function requireCity(cityId: number): void {
  const city = db.prepare(`SELECT 1 AS found FROM cities WHERE id = ? AND ${openCity}`).get(cityId);
  if (city === undefined) {
    throw new DomainError('validation', {
      fieldErrors: { cityId: 'Choose a city from the list.' },
    });
  }
}
