// @vitest-environment node
import { DatabaseSync } from 'node:sqlite';
import { describe, expect, it } from 'vitest';
import { migrate } from '../db/migrate';
import { importCities, parseGeonamesCities, slugOf } from './geonames';

// A GeoNames dump row: id, name, ascii, alternates, lat, lon, class, code, country, cc2, admin1-4,
// population, elevation, dem, timezone, modified.
function row(
  id: number,
  name: string,
  ascii: string,
  country: string,
  population: number,
  timezone: string,
  latitude = '50.0',
  longitude = '19.0',
): string {
  return [
    id,
    name,
    ascii,
    '',
    latitude,
    longitude,
    'P',
    'PPL',
    country,
    '',
    '',
    '',
    '',
    '',
    population,
    '',
    '',
    timezone,
    '2024-01-01',
  ].join('\t');
}

const dump = [
  row(3094802, 'Kraków', 'Krakow', 'PL', 755000, 'Europe/Warsaw', '50.06143', '19.93658'),
  row(2643743, 'London', 'London', 'GB', 8961989, 'Europe/London', '51.50853', '-0.12574'),
  row(5128581, 'New York City', 'New York City', 'US', 8175133, 'America/New_York'),
  row(703448, 'Kyiv', 'Kyiv', 'UA', 2797553, 'Europe/Kiev', '50.45466', '30.5238'),
  'broken line without enough columns',
].join('\n');

function openDatabase(): DatabaseSync {
  const database = new DatabaseSync(':memory:');
  database.exec('PRAGMA foreign_keys = ON');
  migrate(database);
  return database;
}

describe('parseGeonamesCities', () => {
  it('keeps the European cities with their time zone and drops the rest', () => {
    const { cities } = parseGeonamesCities(dump);

    expect(cities.map((city) => city.name)).toEqual(['Kraków', 'London', 'Kyiv']);
    expect(cities[1]).toMatchObject({
      country: 'GB',
      timezone: 'Europe/London',
      population: 8961989,
    });
  });

  it('counts a broken European row instead of stopping', () => {
    const broken = row(1, 'Nowhere', 'Nowhere', 'PL', 20000, '').replace('Europe', '');

    expect(parseGeonamesCities(broken).skipped).toBe(1);
  });
});

describe('slugOf', () => {
  it('makes a plain address-safe name', () => {
    expect(slugOf('Krakow')).toBe('krakow');
    expect(slugOf('Newcastle upon Tyne')).toBe('newcastle-upon-tyne');
  });
});

describe('importCities', () => {
  it('adds new cities and updates the one already linked to GeoNames', () => {
    const database = openDatabase();

    const summary = importCities(database, parseGeonamesCities(dump).cities);

    expect(summary).toEqual({ added: 2, updated: 1 });
    expect(
      database
        .prepare(
          "SELECT slug, population, timezone FROM cities WHERE slug IN ('krakow', 'london') ORDER BY slug",
        )
        .all(),
    ).toEqual([
      expect.objectContaining({ slug: 'krakow', population: 755000, timezone: 'Europe/Warsaw' }),
      expect.objectContaining({ slug: 'london', population: 8961989, timezone: 'Europe/London' }),
    ]);
  });

  it('can run again without adding anything', () => {
    const database = openDatabase();
    const { cities } = parseGeonamesCities(dump);
    importCities(database, cities);

    expect(importCities(database, cities)).toEqual({ added: 0, updated: 3 });
    expect(database.prepare('SELECT COUNT(*) AS total FROM cities').get()?.total).toBe(3);
  });

  it('gives a second city with the same name a different slug', () => {
    const database = openDatabase();
    const same = [
      row(1, 'Newport', 'Newport', 'GB', 150000, 'Europe/London'),
      row(2, 'Newport', 'Newport', 'IE', 20000, 'Europe/Dublin'),
    ].join('\n');

    importCities(database, parseGeonamesCities(same).cities);

    expect(
      database
        .prepare("SELECT slug FROM cities WHERE name = 'Newport' ORDER BY slug")
        .all()
        .map((r) => r.slug),
    ).toEqual(['newport', 'newport-ie']);
  });
});
