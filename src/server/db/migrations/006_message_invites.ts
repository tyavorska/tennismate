import 'server-only';
import type { Migration } from './migration';

/** A "let's play" invite is a message with a court and a time. The latest one is the conversation's plan. */
export const messageInvites: Migration = {
  version: 6,
  name: 'message_invites',
  up: (database) => {
    database.exec(`
      ALTER TABLE messages ADD COLUMN invite_court TEXT;
      ALTER TABLE messages ADD COLUMN invite_slot TEXT;
    `);
  },
};
