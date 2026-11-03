import 'server-only';

import { baseline } from './001_baseline';
import { cities } from './002_cities';
import { courtSources } from './003_court_sources';
import { courtElementsPerCity } from './004_court_elements_per_city';
import type { Migration } from './migration';

export const migrations: readonly Migration[] = [
  baseline,
  cities,
  courtSources,
  courtElementsPerCity,
];

export type { Migration } from './migration';
