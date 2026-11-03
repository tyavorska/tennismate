import type { DatabaseSync } from 'node:sqlite';

export type Migration = Readonly<{
  /** Counts up from 1 with no gaps. Stored in `PRAGMA user_version`. */
  version: number;
  name: string;
  up: (database: DatabaseSync) => void;
}>;
