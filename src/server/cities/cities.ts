import 'server-only';
import { z } from 'zod';
import { citySchema, type City } from '@/entities/city';
import { db } from '../db';
import { DomainError } from '../http';

export function listCities(): readonly City[] {
  const rows = db.prepare('SELECT id, slug, name, country FROM cities').all();
  return z
    .array(citySchema)
    .parse(rows)
    .toSorted((a, b) => a.name.localeCompare(b.name, 'pl'));
}

/** Throws a `validation` error for the `cityId` field when no such city is open. */
export function requireCity(cityId: number): void {
  const city = db.prepare('SELECT 1 AS found FROM cities WHERE id = ?').get(cityId);
  if (city === undefined) {
    throw new DomainError('validation', {
      fieldErrors: { cityId: 'Choose a city from the list.' },
    });
  }
}
