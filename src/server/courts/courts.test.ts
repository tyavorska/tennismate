// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { db } from '../db';
import { addCity } from '../testing/cities';
import { listCourts, listDistricts } from './courts';

describe('listCourts', () => {
  it('puts numbered courts in number order and Polish letters in Polish order', () => {
    const city = addCity('ordering');
    const insert = db.prepare(
      'INSERT INTO courts (city_id, district_id, name, source) VALUES (?, (SELECT id FROM districts WHERE city_id = ?), ?, ?)',
    );
    ['Tennis courts 10', 'Tennis courts 2', 'Łódź Club', 'Zebra Club', 'Cascada'].forEach((name) =>
      insert.run(city.id, city.id, name, 'osm'),
    );

    expect(listCourts(city.id).map((court) => court.name)).toEqual([
      'Cascada',
      'Łódź Club',
      'ordering Courts',
      'Tennis courts 2',
      'Tennis courts 10',
      'Zebra Club',
    ]);
  });

  it('leaves out a hidden court', () => {
    const city = addCity('hidden-one');
    db.prepare('UPDATE courts SET removed_at = ? WHERE city_id = ?').run('2026-11-01', city.id);

    expect(listCourts(city.id)).toEqual([]);
  });
});

describe('listDistricts', () => {
  it('lists the districts of the city only', () => {
    const city = addCity('districts-only');

    expect(listDistricts(city.id)).toEqual([city.district]);
  });
});
