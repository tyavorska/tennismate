import 'server-only';
import { z } from 'zod';
import { db } from '../db';

export type TestCity = Readonly<{ id: number; district: string; court: string }>;

/** A second city with one district and one court, for tests that check the cities stay apart. */
export function addCity(slug: string, timezone = 'Europe/Warsaw'): TestCity {
  const insertCity = db.prepare(
    `INSERT INTO cities (slug, name, country, timezone, latitude, longitude)
     VALUES (?, ?, 'PL', ?, 54.35, 18.65)`,
  );
  const { lastInsertRowid } = insertCity.run(slug, slug, timezone);
  const id = z.coerce.number().parse(lastInsertRowid);

  const district = `${slug} Centre`;
  const court = `${slug} Courts`;
  const insertDistrict = db.prepare(
    'INSERT INTO districts (city_id, name, latitude, longitude) VALUES (?, ?, 54.35, 18.65)',
  );
  const districtId = z.coerce.number().parse(insertDistrict.run(id, district).lastInsertRowid);
  db.prepare('INSERT INTO courts (city_id, district_id, name) VALUES (?, ?, ?)').run(
    id,
    districtId,
    court,
  );
  return { id, district, court };
}

export function addTournament(court: string, date: string): void {
  db.prepare(
    `INSERT INTO tournaments (id, name, court_id, date)
     VALUES (?, 'Test Open', (SELECT id FROM courts WHERE name = ?), ?)`,
  ).run(`tournament-${court}-${date}`, court, date);
}
