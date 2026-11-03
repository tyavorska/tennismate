import 'server-only';
import type { DatabaseSync } from 'node:sqlite';
import { z } from 'zod';
import { migrations as allMigrations, type Migration } from './migrations';
import { transaction } from './transaction';

const versionRowSchema = z.object({ user_version: z.number() });

export function schemaVersion(database: DatabaseSync): number {
  return versionRowSchema.parse(database.prepare('PRAGMA user_version').get()).user_version;
}

function apply(database: DatabaseSync, migration: Migration): void {
  transaction(database, () => {
    // Another module instance may have run it while this one waited.
    if (schemaVersion(database) >= migration.version) return;

    migration.up(database);
    database.exec(`PRAGMA user_version = ${migration.version}`);

    const broken = database.prepare('PRAGMA foreign_key_check').all();
    if (broken.length > 0) {
      throw new Error(`Migration ${migration.version} ${migration.name} broke foreign keys`);
    }
  });
}

/**
 * Brings the database up to the latest schema, one migration at a time. Each runs in its own
 * transaction, so a failure leaves the database at the last version that worked. Foreign keys are
 * off meanwhile, because rebuilding a table means dropping the one others point to.
 */
export function migrate(
  database: DatabaseSync,
  migrations: readonly Migration[] = allMigrations,
): void {
  database.exec('PRAGMA foreign_keys = OFF');
  try {
    migrations
      .toSorted((a, b) => a.version - b.version)
      .filter((migration) => migration.version > schemaVersion(database))
      .forEach((migration) => apply(database, migration));
  } finally {
    database.exec('PRAGMA foreign_keys = ON');
  }
}
