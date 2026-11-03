// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { fitPercent } from './matching';

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
