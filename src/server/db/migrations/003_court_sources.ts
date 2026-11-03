import 'server-only';
import type { Migration } from './migration';

/**
 * Courts and cities can come from outside: OpenStreetMap courts and GeoNames cities. A court keeps
 * where it came from and which OSM elements it was built from, so a re-import updates it instead
 * of adding it again. A court that vanishes from the source is hidden (`removed_at`), not deleted,
 * because games point at it. The courts that exist already are the made-up demo ones.
 */
export const courtSources: Migration = {
  version: 3,
  name: 'court_sources',
  up: (database) => {
    database.exec(`
      ALTER TABLE courts ADD COLUMN source TEXT NOT NULL DEFAULT 'demo';
      ALTER TABLE courts ADD COLUMN latitude REAL;
      ALTER TABLE courts ADD COLUMN longitude REAL;
      ALTER TABLE courts ADD COLUMN surface TEXT;
      ALTER TABLE courts ADD COLUMN lit INTEGER;
      ALTER TABLE courts ADD COLUMN removed_at TEXT;

      CREATE TABLE court_osm_elements (
        osm_type TEXT NOT NULL,
        osm_id INTEGER NOT NULL,
        court_id INTEGER NOT NULL REFERENCES courts(id) ON DELETE CASCADE,
        PRIMARY KEY (osm_type, osm_id)
      );

      CREATE INDEX court_osm_elements_court_id ON court_osm_elements(court_id);

      ALTER TABLE cities ADD COLUMN geonames_id INTEGER;
      ALTER TABLE cities ADD COLUMN population INTEGER;
      CREATE UNIQUE INDEX cities_geonames_id ON cities(geonames_id) WHERE geonames_id IS NOT NULL;

      UPDATE cities SET geonames_id = 3094802 WHERE slug = 'krakow';
    `);
  },
};
