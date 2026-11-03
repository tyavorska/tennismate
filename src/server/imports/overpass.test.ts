// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { krakowOverpass } from './fixtures/krakowData';
import { courtsQuery, parseOverpass, radiusKmFor } from './overpass';

describe('parseOverpass', () => {
  it('reads tennis courts and suburb points from a real Kraków answer', () => {
    const { courts, places } = parseOverpass(krakowOverpass);

    expect(courts).toHaveLength(40);
    expect(places.map((place) => place.name)).toEqual([
      'Kazimierz',
      'Podgórze',
      'Nowa Huta',
      'Prądnik Biały',
    ]);
  });

  it('takes the position of a way from its centre and keeps the tags that matter', () => {
    const { courts } = parseOverpass(krakowOverpass);
    const baszta = courts.find((court) => court.name === 'Klub Sportowy Baszta');

    expect(baszta).toMatchObject({
      type: 'way',
      id: 37674002,
      surface: 'tartan',
      lit: false,
      isCentre: false,
    });
    expect(baszta?.latitude).toBeCloseTo(50.011, 2);
  });

  it('leaves out a place with no name', () => {
    const { places } = parseOverpass(krakowOverpass);

    expect(places.some((place) => place.latitude === 50.0614)).toBe(false);
  });

  it('refuses an answer that is not an Overpass answer', () => {
    expect(() => parseOverpass({ error: 'rate limited' })).toThrow();
  });
});

describe('courtsQuery', () => {
  it('asks for tennis around the city and for suburb points, in one query', () => {
    const query = courtsQuery({ latitude: 50.06, longitude: 19.94, population: 755_000 });

    expect(query).toContain('around:15000,50.06,19.94');
    expect(query).toContain('"sport"="tennis"');
    expect(query).toContain('"place"');
  });
});

describe('radiusKmFor', () => {
  it('looks further around a bigger city', () => {
    expect(radiusKmFor(50_000)).toBe(6);
    expect(radiusKmFor(300_000)).toBe(10);
    expect(radiusKmFor(755_000)).toBe(15);
    expect(radiusKmFor(8_000_000)).toBe(20);
    expect(radiusKmFor(null)).toBe(6);
  });
});
