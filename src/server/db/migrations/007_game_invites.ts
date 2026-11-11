import 'server-only';
import type { Migration } from './migration';

/**
 * A "let's play" invite is a message that proposes a court and a time. The game itself is created
 * only when the other player accepts, so a pending invite is never listed as a game. The court and
 * slot columns that 006 added to messages are replaced by this table.
 */
export const gameInvites: Migration = {
  version: 7,
  name: 'game_invites',
  up: (database) => {
    database.exec(`
      CREATE TABLE game_invites (
        id TEXT PRIMARY KEY,
        message_id TEXT NOT NULL UNIQUE REFERENCES messages(id) ON DELETE CASCADE,
        conversation_id TEXT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
        proposer_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        invitee_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        court_id INTEGER NOT NULL REFERENCES courts(id),
        starts_at TEXT NOT NULL,
        status TEXT NOT NULL CHECK (status IN ('pending', 'accepted', 'declined', 'cancelled')),
        game_id TEXT UNIQUE REFERENCES games(id) ON DELETE SET NULL,
        created_at TEXT NOT NULL,
        responded_at TEXT
      );
      CREATE INDEX game_invites_conversation_id ON game_invites(conversation_id);

      ALTER TABLE messages DROP COLUMN invite_court;
      ALTER TABLE messages DROP COLUMN invite_slot;
    `);
  },
};
