import 'server-only';
import type { DatabaseSync } from 'node:sqlite';
import { z } from 'zod';
import { transaction } from '../db/transaction';
import { europeanCountries } from './europe';

const cityRowSchema = z.object({
  geonamesId: z.coerce.number().int().positive(),
  name: z.string().min(1),
  asciiName: z.string().min(1),
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
  country: z.string().length(2),
  population: z.coerce.number().int().nonnegative(),
  timezone: z.string().min(1),
});

export type ImportedCity = z.infer<typeof cityRowSchema>;

// Columns of a GeoNames "cities" dump, counting from 0 (https://download.geonames.org/export/dump/).
const column = {
  id: 0,
  name: 1,
  asciiName: 2,
  latitude: 4,
  longitude: 5,
  country: 8,
  population: 14,
  timezone: 17,
} as const;

export type ParsedCities = Readonly<{ cities: readonly ImportedCity[]; skipped: number }>;

/** The European rows of a GeoNames dump. Rows that do not parse are counted, not fatal. */
export function parseGeonamesCities(text: string): ParsedCities {
  const rows = text
    .split('\n')
    .filter((line) => line.trim() !== '')
    .map((line) => line.split('\t'));

  const cities: ImportedCity[] = [];
  let skipped = 0;

  rows.forEach((fields) => {
    const country = fields[column.country];
    if (country === undefined || !europeanCountries.has(country)) return;

    const parsed = cityRowSchema.safeParse({
      geonamesId: fields[column.id],
      name: fields[column.name],
      asciiName: fields[column.asciiName],
      latitude: fields[column.latitude],
      longitude: fields[column.longitude],
      country,
      population: fields[column.population],
      timezone: fields[column.timezone],
    });
    if (parsed.success) cities.push(parsed.data);
    else skipped += 1;
  });

  return { cities, skipped };
}

/** "Kraków" is `krakow`, "Newport" in Wales `newport-gb` if `newport` is taken. */
export function slugOf(asciiName: string): string {
  return asciiName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export type CityImportSummary = Readonly<{ added: number; updated: number }>;

/** Adds new cities and refreshes the ones already known by their GeoNames id. Slugs never change. */
export function importCities(
  database: DatabaseSync,
  cities: readonly ImportedCity[],
): CityImportSummary {
  const findByGeonames = database.prepare('SELECT id FROM cities WHERE geonames_id = ?');
  const slugTaken = database.prepare('SELECT 1 AS taken FROM cities WHERE slug = ?');
  const update = database.prepare(
    `UPDATE cities SET name = ?, country = ?, timezone = ?, latitude = ?, longitude = ?, population = ?
     WHERE id = ?`,
  );
  const insert = database.prepare(
    `INSERT INTO cities (slug, name, country, timezone, latitude, longitude, geonames_id, population)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
  );

  function freeSlug(city: ImportedCity): string {
    const base = slugOf(city.asciiName);
    const candidates = [
      base,
      `${base}-${city.country.toLowerCase()}`,
      `${base}-${city.geonamesId}`,
    ];
    return (
      candidates.find((candidate) => slugTaken.get(candidate) === undefined) ??
      candidates[2] ??
      base
    );
  }

  return transaction(database, () => {
    let added = 0;
    let updated = 0;

    cities.forEach((city) => {
      const known = findByGeonames.get(city.geonamesId);
      if (known !== undefined) {
        update.run(
          city.name,
          city.country,
          city.timezone,
          city.latitude,
          city.longitude,
          city.population,
          z.number().parse(known.id),
        );
        updated += 1;
        return;
      }

      insert.run(
        freeSlug(city),
        city.name,
        city.country,
        city.timezone,
        city.latitude,
        city.longitude,
        city.geonamesId,
        city.population,
      );
      added += 1;
    });

    return { added, updated };
  });
}
