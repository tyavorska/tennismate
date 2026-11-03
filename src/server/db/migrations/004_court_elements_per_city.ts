import 'server-only';
import type { Migration } from './migration';

/**
 * An import looks at a circle around a city, and circles of neighbouring cities overlap. The same
 * OSM element can therefore belong to a court in each of them, so the key now includes the city.
 */
export const courtElementsPerCity: Migration = {
  version: 4,
  name: 'court_elements_per_city',
  up: (database) => {
    database.exec(`
      CREATE TABLE court_osm_elements_new (
        city_id INTEGER NOT NULL REFERENCES cities(id),
        osm_type TEXT NOT NULL,
        osm_id INTEGER NOT NULL,
        court_id INTEGER NOT NULL REFERENCES courts(id) ON DELETE CASCADE,
        PRIMARY KEY (city_id, osm_type, osm_id)
      );

      INSERT INTO court_osm_elements_new (city_id, osm_type, osm_id, court_id)
      SELECT courts.city_id, elements.osm_type, elements.osm_id, elements.court_id
      FROM court_osm_elements AS elements JOIN courts ON courts.id = elements.court_id;

      DROP TABLE court_osm_elements;
      ALTER TABLE court_osm_elements_new RENAME TO court_osm_elements;

      CREATE INDEX court_osm_elements_court_id ON court_osm_elements(court_id);
    `);
  },
};
