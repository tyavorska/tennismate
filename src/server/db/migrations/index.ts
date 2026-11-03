import 'server-only';

import { baseline } from './001_baseline';
import { cities } from './002_cities';
import type { Migration } from './migration';

export const migrations: readonly Migration[] = [baseline, cities];

export type { Migration } from './migration';
