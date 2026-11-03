// @vitest-environment node
import { DatabaseSync } from 'node:sqlite';
import { describe, expect, it } from 'vitest';
import { migrate } from '../db/migrate';
import { seedReferenceData } from '../db/seed';
import { importCourts } from './courts';
import { krakowOverpass } from './fixtures/krakowData';
import { parseOverpass, type OsmData } from './overpass';

const now = new Date('2026-11-03T12:00:00.000Z');

function openDatabase(): DatabaseSync {
  const database = new DatabaseSync(':memory:');
  database.exec('PRAGMA foreign_keys = ON');
  migrate(database);
  database.exec(
    "INSERT INTO cities (slug, name, country, timezone, latitude, longitude) VALUES ('town', 'Town', 'PL', 'Europe/Warsaw', 50.0, 19.0)",
  );
  return database;
}

function townId(database: DatabaseSync): number {
  return Number(database.prepare("SELECT id FROM cities WHERE slug = 'town'").get()?.id);
}

function activeCourts(database: DatabaseSync, cityId: number): readonly string[] {
  return database
    .prepare('SELECT name FROM courts WHERE city_id = ? AND removed_at IS NULL ORDER BY name')
    .all(cityId)
    .map((row) => String(row.name));
}

const data = parseOverpass(krakowOverpass);

describe('importCourts', () => {
  it('adds the places with their districts, names and details', () => {
    const database = openDatabase();
    const cityId = townId(database);

    const summary = importCourts(database, cityId, data, { now });

    expect(summary.added).toBeGreaterThan(5);
    expect(summary).toMatchObject({ updated: 0, hidden: 0, districtsAdded: 4 });
    const names = activeCourts(database, cityId);
    expect(names).toContain('Klub Sportowy Baszta');
    expect(names.some((name) => name.startsWith('Tennis courts, '))).toBe(true);
    expect(
      database
        .prepare("SELECT surface, lit, source FROM courts WHERE name = 'Klub Sportowy Baszta'")
        .get(),
    ).toMatchObject({ surface: 'tartan', lit: 0, source: 'osm' });
  });

  it('numbers courts that would get the same name', () => {
    const database = openDatabase();
    const cityId = townId(database);

    importCourts(database, cityId, data, { now });

    const names = activeCourts(database, cityId);
    expect(new Set(names).size).toBe(names.length);
    expect(names.some((name) => /^Tennis courts, .+ 2$/.test(name))).toBe(true);
  });

  it('can run again without adding, renaming or duplicating anything', () => {
    const database = openDatabase();
    const cityId = townId(database);
    importCourts(database, cityId, data, { now });
    const before = activeCourts(database, cityId);

    const again = importCourts(database, cityId, data, { now });

    expect(again).toMatchObject({ added: 0, updated: 0, hidden: 0, districtsAdded: 0 });
    expect(again.unchanged).toBeGreaterThan(5);
    expect(activeCourts(database, cityId)).toEqual(before);
  });

  describe('by default, because our database is the source of truth', () => {
    it('leaves a court exactly as it is, even when OSM says something else', () => {
      const database = openDatabase();
      const cityId = townId(database);
      importCourts(database, cityId, data, { now });
      database
        .prepare(
          "UPDATE courts SET surface = 'grass', latitude = 1 WHERE name = 'Klub Sportowy Baszta'",
        )
        .run();

      importCourts(database, cityId, data, { now });

      expect(
        database
          .prepare("SELECT surface, latitude FROM courts WHERE name = 'Klub Sportowy Baszta'")
          .get(),
      ).toMatchObject({ surface: 'grass', latitude: 1 });
    });

    it('does not hide a court that is missing from the data', () => {
      const database = openDatabase();
      const cityId = townId(database);
      importCourts(database, cityId, data, { now });
      const before = activeCourts(database, cityId);

      const summary = importCourts(
        database,
        cityId,
        { ...data, courts: data.courts.slice(0, 2) },
        { now },
      );

      expect(summary.hidden).toBe(0);
      expect(activeCourts(database, cityId)).toEqual(before);
    });

    it('still adds a place that is new', () => {
      const database = openDatabase();
      const cityId = townId(database);
      importCourts(database, cityId, { ...data, courts: data.courts.slice(0, 5) }, { now });

      const summary = importCourts(database, cityId, data, { now });

      expect(summary.added).toBeGreaterThan(0);
    });
  });

  describe('with refresh', () => {
    it('updates what OSM says about a court it finds again', () => {
      const database = openDatabase();
      const cityId = townId(database);
      importCourts(database, cityId, data, { now });
      database
        .prepare("UPDATE courts SET surface = 'grass' WHERE name = 'Klub Sportowy Baszta'")
        .run();

      const summary = importCourts(database, cityId, data, { now, refresh: true });

      expect(summary.updated).toBeGreaterThan(0);
      expect(
        database.prepare("SELECT surface FROM courts WHERE name = 'Klub Sportowy Baszta'").get()
          ?.surface,
      ).toBe('tartan');
    });

    it('never touches a court that is no longer an OSM court, such as one a club took over', () => {
      const database = openDatabase();
      const cityId = townId(database);
      importCourts(database, cityId, data, { now });
      database
        .prepare(
          "UPDATE courts SET source = 'manual', surface = 'grass' WHERE name = 'Klub Sportowy Baszta'",
        )
        .run();
      const without = data.courts.filter((court) => court.name !== 'Klub Sportowy Baszta');

      importCourts(database, cityId, { ...data, courts: without }, { now, refresh: true });
      importCourts(database, cityId, data, { now, refresh: true });

      expect(
        database
          .prepare("SELECT surface, removed_at FROM courts WHERE name = 'Klub Sportowy Baszta'")
          .get(),
      ).toMatchObject({ surface: 'grass', removed_at: null });
    });
  });

  it('hides a court that left the data, and brings it back when it returns, with refresh', () => {
    const database = openDatabase();
    const cityId = townId(database);
    importCourts(database, cityId, data, { now });
    const gone = data.courts.filter((court) => court.name !== 'Klub Sportowy Baszta');

    const summary = importCourts(
      database,
      cityId,
      { ...data, courts: gone },
      { now, refresh: true },
    );

    expect(summary.hidden).toBeGreaterThanOrEqual(1);
    expect(activeCourts(database, cityId)).not.toContain('Klub Sportowy Baszta');
    expect(
      database.prepare("SELECT removed_at FROM courts WHERE name = 'Klub Sportowy Baszta'").get()
        ?.removed_at,
    ).toBe(now.toISOString());

    importCourts(database, cityId, data, { now, refresh: true });
    expect(activeCourts(database, cityId)).toContain('Klub Sportowy Baszta');
  });

  it('keeps a hidden court, so a game on it still has a court', () => {
    const database = openDatabase();
    const cityId = townId(database);
    importCourts(database, cityId, data, { now });
    const gone: OsmData = { ...data, courts: data.courts.slice(0, 1) };

    importCourts(database, cityId, gone, { now, refresh: true });

    expect(
      database
        .prepare("SELECT COUNT(*) AS total FROM courts WHERE city_id = ? AND source = 'osm'")
        .get(cityId)?.total,
    ).toBeGreaterThan(5);
  });

  it('puts each court in the district nearest to it', () => {
    const database = openDatabase();
    const cityId = townId(database);

    importCourts(database, cityId, data, { now });

    const rows = database
      .prepare(
        'SELECT districts.name AS district FROM courts JOIN districts ON districts.id = courts.district_id WHERE courts.city_id = ?',
      )
      .all(cityId);
    expect(
      rows.every((row) =>
        ['Kazimierz', 'Podgórze', 'Nowa Huta', 'Prądnik Biały'].includes(String(row.district)),
      ),
    ).toBe(true);
  });

  it('uses the city itself as the district when the data has no suburb points', () => {
    const database = openDatabase();
    const cityId = townId(database);

    importCourts(database, cityId, { courts: data.courts, places: [] }, { now });

    expect(
      database
        .prepare('SELECT name FROM districts WHERE city_id = ?')
        .all(cityId)
        .map((row) => row.name),
    ).toEqual(['Town']);
  });

  it('refuses an empty answer and changes nothing', () => {
    const database = openDatabase();
    const cityId = townId(database);
    importCourts(database, cityId, data, { now });
    const before = activeCourts(database, cityId);

    expect(() => importCourts(database, cityId, { courts: [], places: [] }, { now })).toThrow(
      'Nothing was changed',
    );

    expect(activeCourts(database, cityId)).toEqual(before);
  });

  describe('two cities whose circles overlap', () => {
    function twoTowns(): { database: DatabaseSync; first: number; second: number } {
      const database = openDatabase();
      database.exec(
        "INSERT INTO cities (slug, name, country, timezone, latitude, longitude) VALUES ('next', 'Next', 'PL', 'Europe/Warsaw', 50.0, 19.0)",
      );
      const id = (slug: string) =>
        Number(database.prepare('SELECT id FROM cities WHERE slug = ?').get(slug)?.id);
      return { database, first: id('town'), second: id('next') };
    }

    it('each get their own copy of the same courts, and both open', () => {
      const { database, first, second } = twoTowns();

      importCourts(database, first, data, { now });
      const added = importCourts(database, second, data, { now });

      expect(added.added).toBeGreaterThan(5);
      expect(activeCourts(database, second)).toEqual(activeCourts(database, first));
    });

    it('add nothing when either is imported again', () => {
      const { database, first, second } = twoTowns();
      importCourts(database, first, data, { now });
      importCourts(database, second, data, { now });

      expect(importCourts(database, first, data, { now })).toMatchObject({ added: 0, hidden: 0 });
      expect(importCourts(database, second, data, { now })).toMatchObject({ added: 0, hidden: 0 });
    });

    it('never hide or unhide the courts of the other city', () => {
      const { database, first, second } = twoTowns();
      importCourts(database, first, data, { now });
      importCourts(database, second, data, { now });
      const secondBefore = activeCourts(database, second);

      importCourts(
        database,
        first,
        { ...data, courts: data.courts.slice(0, 1) },
        { now, refresh: true },
      );

      expect(activeCourts(database, second)).toEqual(secondBefore);
      expect(activeCourts(database, first).length).toBeLessThan(secondBefore.length);
    });
  });

  it('leaves the demo courts of the city alone', () => {
    const database = openDatabase();
    seedReferenceData(database, { demoCourts: true });
    const krakow = Number(
      database.prepare("SELECT id FROM cities WHERE slug = 'krakow'").get()?.id,
    );

    importCourts(database, krakow, data, { now });

    expect(activeCourts(database, krakow)).toContain('Park Jordana');
  });
});
