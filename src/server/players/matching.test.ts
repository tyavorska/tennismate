// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { distanceKm, fitPercent } from './matching';

const oldTown = { latitude: 50.0614, longitude: 19.9366 };
const nowaHuta = { latitude: 50.0722, longitude: 20.0371 };

describe('distanceKm', () => {
  it('measures the distance between two districts', () => {
    expect(distanceKm(oldTown, nowaHuta)).toBeCloseTo(7.2, 0);
  });

  it('never reports less than half a kilometre', () => {
    expect(distanceKm(oldTown, oldTown)).toBe(0.5);
  });
});

describe('fitPercent', () => {
  it('is 100 for the same level close by', () => {
    expect(fitPercent(3.5, 3.5, 0)).toBe(100);
  });

  it('drops as the level gap grows', () => {
    expect(fitPercent(3.5, 3.5, 2)).toBeGreaterThan(fitPercent(3.5, 4, 2));
    expect(fitPercent(3.5, 4, 2)).toBeGreaterThan(fitPercent(3.5, 5, 2));
  });

  it('drops as the distance grows', () => {
    expect(fitPercent(3.5, 3.5, 1)).toBeGreaterThan(fitPercent(3.5, 3.5, 6));
  });

  it('never goes below zero', () => {
    expect(fitPercent(1, 7, 50)).toBe(0);
  });
});
