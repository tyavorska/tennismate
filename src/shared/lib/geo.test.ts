import { describe, expect, it } from 'vitest';
import { distanceKm } from './geo';

const oldTown = { latitude: 50.0614, longitude: 19.9366 };
const nowaHuta = { latitude: 50.0722, longitude: 20.0371 };

describe('distanceKm', () => {
  it('measures the distance between two places', () => {
    expect(distanceKm(oldTown, nowaHuta)).toBeCloseTo(7.2, 0);
  });

  it('never reports less than half a kilometre', () => {
    expect(distanceKm(oldTown, oldTown)).toBe(0.5);
  });
});
