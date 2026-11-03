import 'server-only';
import type { DatabaseSync } from 'node:sqlite';

/** Runs the work as one unit: everything is saved, or nothing is. */
export function transaction<T>(database: DatabaseSync, work: () => T): T {
  database.exec('BEGIN IMMEDIATE');
  try {
    const result = work();
    database.exec('COMMIT');
    return result;
  } catch (error) {
    database.exec('ROLLBACK');
    throw error;
  }
}
