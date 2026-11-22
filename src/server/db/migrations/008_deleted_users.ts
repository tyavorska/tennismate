import 'server-only';
import type { Migration } from './migration';

/**
 * A deleted account stays as an anonymous `users` row, so the conversations the person was in keep
 * their history. `deleted_at` marks it. The email, password and profile are removed.
 */
export const deletedUsers: Migration = {
  version: 8,
  name: 'deleted_users',
  up: (database) => {
    database.exec('ALTER TABLE users ADD COLUMN deleted_at TEXT');
  },
};
