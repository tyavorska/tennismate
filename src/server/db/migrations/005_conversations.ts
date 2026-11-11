import 'server-only';
import type { Migration } from './migration';

/**
 * A conversation is one row per pair of players, stored with the smaller id first so the pair has
 * one spelling. Message ids are random and two can share a millisecond, so order, read positions
 * and cursors use the table's `rowid`, which grows with every insert.
 */
export const conversations: Migration = {
  version: 5,
  name: 'conversations',
  up: (database) => {
    database.exec(`
      CREATE TABLE conversations (
        id TEXT PRIMARY KEY,
        user_a TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        user_b TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        created_at TEXT NOT NULL,
        CHECK (user_a < user_b),
        UNIQUE (user_a, user_b)
      );
      CREATE INDEX conversations_user_b ON conversations(user_b);

      CREATE TABLE messages (
        id TEXT PRIMARY KEY,
        conversation_id TEXT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
        sender_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        client_message_id TEXT NOT NULL,
        body TEXT NOT NULL,
        created_at TEXT NOT NULL,
        UNIQUE (conversation_id, sender_id, client_message_id)
      );
      CREATE INDEX messages_conversation_id ON messages(conversation_id);

      CREATE TABLE conversation_members (
        conversation_id TEXT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        last_read_message_id TEXT REFERENCES messages(id) ON DELETE SET NULL,
        PRIMARY KEY (conversation_id, user_id)
      );
      CREATE INDEX conversation_members_user_id ON conversation_members(user_id);
    `);
  },
};
