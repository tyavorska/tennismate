import { readFileSync } from 'node:fs';
import type { z } from 'zod';

/** A trimmed answer from the Overpass API for Kraków. Data © OpenStreetMap contributors, ODbL. */
export const krakowOverpass: z.core.util.JSONType = JSON.parse(
  readFileSync(new URL('./krakowOverpass.json', import.meta.url), 'utf8'),
);
