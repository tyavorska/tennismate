// `next build` loads route modules in parallel workers, and each one opens the database. On a fresh
// checkout they race to switch a new file into WAL mode and fail with "database is locked".
// Creating the file in WAL mode first means the workers only find it already set up.
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { DatabaseSync } from 'node:sqlite';

const path = process.env.DATABASE_PATH ?? 'data/tennismate.db';
if (path !== ':memory:') mkdirSync(dirname(path), { recursive: true });
const database = new DatabaseSync(path);
database.exec('PRAGMA journal_mode = WAL');
database.close();
