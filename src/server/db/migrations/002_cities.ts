import 'server-only';
import type { Migration } from './migration';

/**
 * Every district, court and profile belongs to a city. Names are only unique inside a city, so
 * districts and courts get ids. The old tables are rebuilt and the existing rows go to Kraków.
 */
export const cities: Migration = {
  version: 2,
  name: 'cities',
  up: (database) => {
    database.exec(`
      CREATE TABLE cities (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        slug TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        country TEXT NOT NULL,
        timezone TEXT NOT NULL,
        latitude REAL NOT NULL,
        longitude REAL NOT NULL
      );

      INSERT INTO cities (slug, name, country, timezone, latitude, longitude)
      VALUES ('krakow', 'Kraków', 'PL', 'Europe/Warsaw', 50.0647, 19.945);

      CREATE TABLE districts_new (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        city_id INTEGER NOT NULL REFERENCES cities(id),
        name TEXT NOT NULL,
        latitude REAL NOT NULL,
        longitude REAL NOT NULL,
        UNIQUE (city_id, name),
        UNIQUE (id, city_id)
      );

      INSERT INTO districts_new (city_id, name, latitude, longitude)
      SELECT (SELECT id FROM cities WHERE slug = 'krakow'), name, latitude, longitude
      FROM districts ORDER BY name;

      CREATE TABLE courts_new (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        city_id INTEGER NOT NULL REFERENCES cities(id),
        district_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        UNIQUE (city_id, name),
        FOREIGN KEY (district_id, city_id) REFERENCES districts_new(id, city_id)
      );

      INSERT INTO courts_new (id, city_id, district_id, name)
      SELECT courts.id, districts_new.city_id, districts_new.id, courts.name
      FROM courts JOIN districts_new ON districts_new.name = courts.district;

      CREATE TABLE profiles_new (
        user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        city_id INTEGER NOT NULL REFERENCES cities(id),
        district_id INTEGER NOT NULL,
        rating REAL NOT NULL,
        age INTEGER,
        play_style TEXT,
        formats TEXT NOT NULL,
        times TEXT NOT NULL,
        free_tonight INTEGER NOT NULL DEFAULT 0,
        wants_doubles_partner INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY (district_id, city_id) REFERENCES districts_new(id, city_id)
      );

      INSERT INTO profiles_new
        (user_id, name, city_id, district_id, rating, age, play_style, formats, times,
         free_tonight, wants_doubles_partner, created_at, updated_at)
      SELECT profiles.user_id, profiles.name, districts_new.city_id, districts_new.id,
             profiles.rating, profiles.age, profiles.play_style, profiles.formats, profiles.times,
             profiles.free_tonight, profiles.wants_doubles_partner, profiles.created_at,
             profiles.updated_at
      FROM profiles JOIN districts_new ON districts_new.name = profiles.district;

    `);

    // The copies join on district names, so a row with an unknown district would be dropped silently.
    const counts = database
      .prepare(
        `SELECT (SELECT COUNT(*) FROM courts) AS courts, (SELECT COUNT(*) FROM courts_new) AS courts_new,
                (SELECT COUNT(*) FROM profiles) AS profiles, (SELECT COUNT(*) FROM profiles_new) AS profiles_new`,
      )
      .get();
    if (counts?.courts !== counts?.courts_new || counts?.profiles !== counts?.profiles_new) {
      throw new Error('Some courts or profiles have a district that does not exist');
    }

    database.exec(`
      DROP TABLE profiles;
      DROP TABLE courts;
      DROP TABLE districts;
      ALTER TABLE districts_new RENAME TO districts;
      ALTER TABLE courts_new RENAME TO courts;
      ALTER TABLE profiles_new RENAME TO profiles;

      CREATE INDEX profiles_city_id ON profiles(city_id);
      CREATE INDEX courts_city_id ON courts(city_id);
    `);
  },
};
