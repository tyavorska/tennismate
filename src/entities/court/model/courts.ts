import type { Court } from './types';

export const courts: readonly Court[] = [
  {
    id: 'central-park',
    name: 'Central Park Tennis Center',
    city: 'New York',
    surface: 'hard',
    courtCount: 26,
    indoor: false,
  },
  {
    id: 'riverside-clay',
    name: 'Riverside Clay Club',
    city: 'Boston',
    surface: 'clay',
    courtCount: 8,
    indoor: false,
  },
  {
    id: 'greenfield',
    name: 'Greenfield Grass Courts',
    city: 'Philadelphia',
    surface: 'grass',
    courtCount: 4,
    indoor: false,
  },
  {
    id: 'downtown-indoor',
    name: 'Downtown Indoor Arena',
    city: 'Chicago',
    surface: 'hard',
    courtCount: 12,
    indoor: true,
  },
  {
    id: 'lakeside',
    name: 'Lakeside Racquet Club',
    city: 'Seattle',
    surface: 'hard',
    courtCount: 10,
    indoor: true,
  },
  {
    id: 'sunset-clay',
    name: 'Sunset Clay Courts',
    city: 'Los Angeles',
    surface: 'clay',
    courtCount: 6,
    indoor: false,
  },
];
