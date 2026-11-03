// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { krakowOverpass } from './fixtures/krakowData';
import { parseOverpass, type OsmCourt } from './overpass';
import { clusterCourts } from './venues';

function court(
  id: number,
  latitude: number,
  longitude: number,
  rest: Partial<OsmCourt> = {},
): OsmCourt {
  return {
    type: 'way',
    id,
    latitude,
    longitude,
    isCentre: false,
    name: undefined,
    surface: undefined,
    lit: undefined,
    ...rest,
  };
}

describe('clusterCourts', () => {
  it('joins courts a few metres apart into one place', () => {
    const venues = clusterCourts([
      court(1, 50.0, 19.0),
      court(2, 50.0003, 19.0),
      court(3, 50.0006, 19.0),
    ]);

    expect(venues).toHaveLength(1);
    expect(venues[0]?.elements.map((element) => element.id)).toEqual([1, 2, 3]);
  });

  it('keeps courts far apart separate', () => {
    expect(clusterCourts([court(1, 50.0, 19.0), court(2, 50.01, 19.0)])).toHaveLength(2);
  });

  it('puts the place in the middle of its courts', () => {
    const [venue] = clusterCourts([court(1, 50.0, 19.0), court(2, 50.0004, 19.0)]);

    expect(venue?.latitude).toBeCloseTo(50.0002, 5);
  });

  it('takes the name of the tennis centre over the name of a court', () => {
    const [venue] = clusterCourts([
      court(1, 50.0, 19.0, { name: 'Court 4' }),
      court(2, 50.0002, 19.0, { name: 'Baszta', isCentre: true }),
    ]);

    expect(venue?.name).toBe('Baszta');
  });

  it('takes the most common surface and says lit when any court is lit', () => {
    const [venue] = clusterCourts([
      court(1, 50.0, 19.0, { surface: 'clay', lit: false }),
      court(2, 50.0002, 19.0, { surface: 'clay', lit: true }),
      court(3, 50.0004, 19.0, { surface: 'tartan' }),
    ]);

    expect(venue).toMatchObject({ surface: 'clay', lit: true });
  });

  it('turns the 40 courts of the Kraków sample into fewer places and keeps every element', () => {
    const { courts } = parseOverpass(krakowOverpass);

    const venues = clusterCourts(courts);

    expect(venues.length).toBeLessThan(courts.length);
    expect(venues.flatMap((venue) => venue.elements)).toHaveLength(courts.length);
    expect(venues.filter((venue) => venue.name !== undefined).length).toBeGreaterThanOrEqual(5);
  });
});
