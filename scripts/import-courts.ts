/**
 * Brings the tennis courts of one city in from OpenStreetMap. It makes one request to the public
 * Overpass server, so run it for a city someone asked for, not for every city at once.
 *
 *   npm run import:courts -- krakow
 *   npm run import:courts -- krakow --from-file answer.json   (no request, for a saved answer)
 *   npm run import:courts -- krakow --refresh   (also update OSM courts and hide those that are gone)
 *
 * By default it only adds places that are new: the database is the source of truth, and clubs will
 * edit their own courts. Use --refresh on purpose, and never with a partial answer.
 */
import { readFileSync } from 'node:fs';
import { z } from 'zod';
import { db } from '@/server/db';
import { courtsQuery, fetchOverpass, importCourts, parseOverpass } from '@/server/imports';

const args = process.argv.slice(2);
const [slug] = args;
const refresh = args.includes('--refresh');
const fileFlag = args.indexOf('--from-file');
const file = fileFlag === -1 ? undefined : args[fileFlag + 1];
if (slug === undefined) {
  console.error(
    'Usage: npm run import:courts -- <city slug> [--from-file <answer.json>] [--refresh]',
  );
  process.exit(1);
}

const row = db
  .prepare('SELECT id, name, latitude, longitude, population FROM cities WHERE slug = ?')
  .get(slug);
if (row === undefined) {
  console.error(`No city with the slug "${slug}". Run import:cities first.`);
  process.exit(1);
}
const city = z
  .object({
    id: z.number(),
    name: z.string(),
    latitude: z.number(),
    longitude: z.number(),
    population: z.number().nullable(),
  })
  .parse(row);

async function run(): Promise<void> {
  const answer =
    file !== undefined
      ? JSON.parse(readFileSync(file, 'utf8'))
      : await fetchOverpass(courtsQuery(city));

  const summary = importCourts(db, city.id, parseOverpass(answer), { refresh });
  console.log(
    `${city.name}: ${summary.added} added, ${summary.unchanged} already there and left as they are, ` +
      `${summary.updated} updated, ${summary.hidden} hidden, ${summary.districtsAdded} districts added.`,
  );
}

run().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
