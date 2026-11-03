import 'server-only';
import type { DatabaseSync } from 'node:sqlite';
import { z } from 'zod';
import { exactDistanceKm } from '@/shared/lib';
import { transaction } from '../db/transaction';
import type { OsmData } from './overpass';
import { clusterCourts, type Venue } from './venues';

export type CourtImportSummary = Readonly<{
  added: number;
  /** Places already in the database, left exactly as they are. */
  unchanged: number;
  updated: number;
  hidden: number;
  districtsAdded: number;
}>;

export type CourtImportOptions = Readonly<{
  /**
   * Also update the OSM courts already in the database and hide the ones that left the data.
   * Without it an import only adds places that are new. Courts a club has taken over
   * (`source` other than `osm`) are never touched either way.
   */
  refresh?: boolean;
  now?: Date;
}>;

const cityRowSchema = z.object({ name: z.string(), latitude: z.number(), longitude: z.number() });
const districtRowSchema = z.object({
  id: z.number(),
  name: z.string(),
  latitude: z.number(),
  longitude: z.number(),
});

type District = z.infer<typeof districtRowSchema>;

function nearest(districts: readonly District[], venue: Venue): District {
  const [closest] = districts.toSorted(
    (a, b) => exactDistanceKm(venue, a) - exactDistanceKm(venue, b),
  );
  if (closest === undefined) throw new Error('The city has no district to place a court in');
  return closest;
}

/**
 * Brings a city's OSM courts in. Our database is the source of truth for courts, so by default
 * this only adds places that are new and changes nothing that is already there. With `refresh` it
 * also updates OSM courts it finds again, and hides (never deletes, because games point at them)
 * OSM courts that are gone. Names are chosen once and kept.
 */
export function importCourts(
  database: DatabaseSync,
  cityId: number,
  data: OsmData,
  { refresh = false, now = new Date() }: CourtImportOptions = {},
): CourtImportSummary {
  if (data.courts.length === 0) {
    // An empty answer is more likely a failed query than a city with no courts left.
    throw new Error('No courts in the data. Nothing was changed.');
  }

  const city = cityRowSchema.parse(
    database.prepare('SELECT name, latitude, longitude FROM cities WHERE id = ?').get(cityId),
  );
  const insertDistrict = database.prepare(
    'INSERT OR IGNORE INTO districts (city_id, name, latitude, longitude) VALUES (?, ?, ?, ?)',
  );
  const findElement = database.prepare(
    'SELECT court_id FROM court_osm_elements WHERE city_id = ? AND osm_type = ? AND osm_id = ?',
  );
  const nameTaken = database.prepare(
    'SELECT 1 AS taken FROM courts WHERE city_id = ? AND name = ?',
  );
  const insertCourt = database.prepare(
    `INSERT INTO courts (city_id, district_id, name, source, latitude, longitude, surface, lit)
     VALUES (?, ?, ?, 'osm', ?, ?, ?, ?)`,
  );
  const updateCourt = database.prepare(
    `UPDATE courts SET latitude = ?, longitude = ?, surface = ?, lit = ?, removed_at = NULL
     WHERE id = ? AND source = 'osm'`,
  );
  const insertElement = database.prepare(
    'INSERT OR IGNORE INTO court_osm_elements (city_id, osm_type, osm_id, court_id) VALUES (?, ?, ?, ?)',
  );

  function listDistricts(): readonly District[] {
    return z
      .array(districtRowSchema)
      .parse(
        database
          .prepare('SELECT id, name, latitude, longitude FROM districts WHERE city_id = ?')
          .all(cityId),
      );
  }

  function uniqueName(wanted: string): string {
    const numbered = (number: number): string => (number === 1 ? wanted : `${wanted} ${number}`);
    let number = 1;
    while (nameTaken.get(cityId, numbered(number)) !== undefined) number += 1;
    return numbered(number);
  }

  function listMissing(seen: ReadonlySet<number>): readonly { id: number }[] {
    return z
      .array(z.object({ id: z.number() }))
      .parse(
        database
          .prepare(
            "SELECT id FROM courts WHERE city_id = ? AND source = 'osm' AND removed_at IS NULL",
          )
          .all(cityId),
      )
      .filter((court) => !seen.has(court.id));
  }

  return transaction(database, () => {
    const before = listDistricts().length;
    data.places.forEach((place) =>
      insertDistrict.run(cityId, place.name, place.latitude, place.longitude),
    );
    // A city with no suburb points still needs somewhere to put its courts.
    if (listDistricts().length === 0) {
      insertDistrict.run(cityId, city.name, city.latitude, city.longitude);
    }
    const districts = listDistricts();

    const seen = new Set<number>();
    let added = 0;
    let unchanged = 0;
    let updated = 0;

    clusterCourts(data.courts).forEach((venue) => {
      const known = venue.elements
        .map(({ type, id }) => findElement.get(cityId, type, id))
        .find((row) => row !== undefined);
      const lit = venue.lit === undefined ? null : Number(venue.lit);

      let courtId: number;
      if (known !== undefined) {
        courtId = z.number().parse(known.court_id);
        if (refresh) {
          const { changes } = updateCourt.run(
            venue.latitude,
            venue.longitude,
            venue.surface ?? null,
            lit,
            courtId,
          );
          if (changes > 0) updated += 1;
          else unchanged += 1;
        } else {
          unchanged += 1;
        }
      } else {
        const district = nearest(districts, venue);
        const name = uniqueName(venue.name ?? `Tennis courts, ${district.name}`);
        const { lastInsertRowid } = insertCourt.run(
          cityId,
          district.id,
          name,
          venue.latitude,
          venue.longitude,
          venue.surface ?? null,
          lit,
        );
        courtId = z.coerce.number().parse(lastInsertRowid);
        added += 1;
      }

      seen.add(courtId);
      venue.elements.forEach(({ type, id }) => insertElement.run(cityId, type, id, courtId));
    });

    const stale = refresh ? listMissing(seen) : [];
    const hide = database.prepare('UPDATE courts SET removed_at = ? WHERE id = ?');
    stale.forEach((court) => hide.run(now.toISOString(), court.id));

    return {
      added,
      unchanged,
      updated,
      hidden: stale.length,
      districtsAdded: districts.length - before,
    };
  });
}
