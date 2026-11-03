/**
 * Adds the European cities of a GeoNames dump to the database.
 *
 *   curl -O https://download.geonames.org/export/dump/cities15000.zip && unzip cities15000.zip
 *   npm run import:cities -- cities15000.txt
 */
import { readFileSync } from 'node:fs';
import { db } from '@/server/db';
import { importCities, parseGeonamesCities } from '@/server/imports';

const [file] = process.argv.slice(2);
if (file === undefined) {
  console.error('Usage: npm run import:cities -- <path to cities15000.txt>');
  process.exit(1);
}

const { cities, skipped } = parseGeonamesCities(readFileSync(file, 'utf8'));
const { added, updated } = importCities(db, cities);
console.log(`Cities: ${added} added, ${updated} updated, ${skipped} rows skipped.`);
