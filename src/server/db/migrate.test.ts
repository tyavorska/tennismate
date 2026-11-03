// @vitest-environment node
import { DatabaseSync } from 'node:sqlite';
import { describe, expect, it } from 'vitest';
import { migrate, schemaVersion } from './migrate';
import { migrations, type Migration } from './migrations';

function openDatabase(): DatabaseSync {
  const database = new DatabaseSync(':memory:');
  database.exec('PRAGMA foreign_keys = ON');
  return database;
}

function names(database: DatabaseSync, table: string): readonly string[] {
  return database
    .prepare(`SELECT name FROM ${table} ORDER BY name`)
    .all()
    .map((row) => String(row.name));
}

describe('migrate', () => {
  it('builds the whole schema on an empty database', () => {
    const database = openDatabase();

    migrate(database);

    expect(schemaVersion(database)).toBe(migrations.length);
    expect(names(database, 'cities')).toEqual(['Kraków']);
    expect(names(database, "sqlite_master WHERE type = 'table'")).toEqual(
      expect.arrayContaining(['users', 'profiles', 'courts', 'districts', 'games', 'cities']),
    );
  });

  it('does nothing the second time', () => {
    const database = openDatabase();
    migrate(database);

    migrate(database);

    expect(schemaVersion(database)).toBe(migrations.length);
  });

  it('turns foreign keys back on afterwards', () => {
    const database = openDatabase();

    migrate(database);

    expect(database.prepare('PRAGMA foreign_keys').get()?.foreign_keys).toBe(1);
  });

  describe('from the schema before cities', () => {
    function databaseWithOldData(): DatabaseSync {
      const database = openDatabase();
      migrate(database, migrations.slice(0, 1));
      database.exec(`
        INSERT INTO users (id, email, password_hash, created_at)
        VALUES ('u1', 'a@example.com', 'x', 'now'), ('u2', 'b@example.com', 'x', 'now');
        INSERT INTO districts (name, latitude, longitude)
        VALUES ('Kazimierz', 50.05, 19.94), ('Podgórze', 50.04, 19.95);
        INSERT INTO courts (id, name, district)
        VALUES (7, 'Kazimierz Clay Club', 'Kazimierz'), (9, 'Podgórze Arena', 'Podgórze');
        INSERT INTO profiles (user_id, name, district, rating, formats, times, created_at, updated_at)
        VALUES ('u1', 'Ana', 'Podgórze', 3.5, '[]', '[]', 'now', 'now');
        INSERT INTO games (id, host_id, court_id, starts_at, format, rating, spots, looking_for, note, created_at)
        VALUES ('g1', 'u1', 9, '2026-11-05T17:00:00.000Z', 'singles', 3.5, 1, 'nearLevel', '', 'now');
        INSERT INTO game_participants (game_id, user_id, joined_at) VALUES ('g1', 'u2', 'now');
        INSERT INTO saved_players (user_id, player_id, created_at) VALUES ('u2', 'u1', 'now');
      `);
      return database;
    }

    it('moves the existing rows to Kraków and keeps them linked', () => {
      const database = databaseWithOldData();

      migrate(database);

      const profile = database
        .prepare(
          `SELECT cities.slug AS city, districts.name AS district FROM profiles
           JOIN districts ON districts.id = profiles.district_id
           JOIN cities ON cities.id = profiles.city_id WHERE user_id = 'u1'`,
        )
        .get();
      expect(profile).toMatchObject({ city: 'krakow', district: 'Podgórze' });
      expect(names(database, 'courts')).toEqual(['Kazimierz Clay Club', 'Podgórze Arena']);
    });

    it('keeps court ids, so games still point at the same court', () => {
      const database = databaseWithOldData();

      migrate(database);

      const game = database
        .prepare(
          `SELECT courts.name FROM games JOIN courts ON courts.id = games.court_id WHERE games.id = 'g1'`,
        )
        .get();
      expect(game?.name).toBe('Podgórze Arena');
      expect(database.prepare('SELECT COUNT(*) AS total FROM game_participants').get()?.total).toBe(
        1,
      );
      expect(database.prepare('SELECT COUNT(*) AS total FROM saved_players').get()?.total).toBe(1);
    });

    it('leaves no broken foreign keys', () => {
      const database = databaseWithOldData();

      migrate(database);

      expect(database.prepare('PRAGMA foreign_key_check').all()).toEqual([]);
    });

    it('stops, and changes nothing, when a profile has a district that does not exist', () => {
      const database = databaseWithOldData();
      database.exec('PRAGMA foreign_keys = OFF');
      database.exec(`INSERT INTO profiles (user_id, name, district, rating, formats, times, created_at, updated_at)
                     VALUES ('u2', 'Ben', 'Atlantis', 3, '[]', '[]', 'now', 'now')`);
      database.exec('PRAGMA foreign_keys = ON');

      expect(() => migrate(database)).toThrow('district that does not exist');

      expect(schemaVersion(database)).toBe(1);
      expect(database.prepare('SELECT COUNT(*) AS total FROM profiles').get()?.total).toBe(2);
    });

    it('refuses a district that does not belong to the profile city', () => {
      const database = databaseWithOldData();
      migrate(database);
      database.exec(`INSERT INTO cities (slug, name, country, timezone, latitude, longitude)
                     VALUES ('other', 'Other', 'PL', 'Europe/Warsaw', 0, 0)`);

      expect(() =>
        database.exec(`UPDATE profiles SET city_id = (SELECT id FROM cities WHERE slug = 'other')`),
      ).toThrow();
    });
  });

  describe('court sources', () => {
    it('marks the courts that exist as demo courts and links Kraków to GeoNames', () => {
      const database = openDatabase();
      migrate(database, migrations.slice(0, 2));
      database.exec(`INSERT INTO districts (city_id, name, latitude, longitude)
                     VALUES (1, 'Kazimierz', 50.05, 19.94);
                     INSERT INTO courts (city_id, district_id, name)
                     VALUES (1, (SELECT id FROM districts WHERE name = 'Kazimierz'), 'Old Court')`);

      migrate(database);

      expect(
        database.prepare("SELECT source, removed_at FROM courts WHERE name = 'Old Court'").get(),
      ).toMatchObject({
        source: 'demo',
        removed_at: null,
      });
      expect(
        database.prepare("SELECT geonames_id FROM cities WHERE slug = 'krakow'").get()?.geonames_id,
      ).toBe(3094802);
    });

    it('keeps an OSM element once per city, so a re-import finds the court it made', () => {
      const database = openDatabase();
      migrate(database);
      database.exec(`INSERT INTO districts (city_id, name, latitude, longitude) VALUES (1, 'D', 0, 0);
                     INSERT INTO courts (city_id, district_id, name, source) VALUES (1, (SELECT id FROM districts WHERE name = 'D'), 'C', 'osm');
                     INSERT INTO court_osm_elements (city_id, osm_type, osm_id, court_id) VALUES (1, 'way', 5, (SELECT id FROM courts WHERE name = 'C'))`);

      expect(() =>
        database.exec(
          `INSERT INTO court_osm_elements (city_id, osm_type, osm_id, court_id) VALUES (1, 'way', 5, 1)`,
        ),
      ).toThrow();
    });

    it('moves existing elements to the city of their court', () => {
      const database = openDatabase();
      migrate(database, migrations.slice(0, 3));
      database.exec(`INSERT INTO districts (city_id, name, latitude, longitude) VALUES (1, 'D', 0, 0);
                     INSERT INTO courts (city_id, district_id, name, source) VALUES (1, (SELECT id FROM districts WHERE name = 'D'), 'C', 'osm');
                     INSERT INTO court_osm_elements (osm_type, osm_id, court_id) VALUES ('way', 5, (SELECT id FROM courts WHERE name = 'C'))`);

      migrate(database);

      expect(database.prepare('SELECT city_id, osm_id FROM court_osm_elements').all()).toEqual([
        expect.objectContaining({ city_id: 1, osm_id: 5 }),
      ]);
    });
  });

  describe('when a migration fails', () => {
    const failing: Migration = {
      version: 2,
      name: 'failing',
      up: (database) => {
        database.exec('CREATE TABLE half_done (id INTEGER)');
        throw new Error('boom');
      },
    };

    it('undoes that migration and stays on the last version that worked', () => {
      const database = openDatabase();

      expect(() => migrate(database, [migrations[0] ?? failing, failing])).toThrow('boom');

      expect(schemaVersion(database)).toBe(1);
      expect(names(database, "sqlite_master WHERE name = 'half_done'")).toEqual([]);
      expect(database.prepare('PRAGMA foreign_keys').get()?.foreign_keys).toBe(1);
    });
  });
});
