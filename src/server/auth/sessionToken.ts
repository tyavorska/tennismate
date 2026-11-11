import 'server-only';
import { createHash } from 'node:crypto';
import { userSchema, type User } from '@/entities/user';
import { db } from '../db/db';

// Only the hash is stored, so a leaked database cannot be used to sign in.
export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

/** The user a session token belongs to, or `undefined` when it is unknown or has expired. */
export function findUserBySessionToken(token: string, now: Date = new Date()): User | undefined {
  const row = db
    .prepare(
      `SELECT users.id, users.email FROM sessions
       JOIN users ON users.id = sessions.user_id
       WHERE sessions.token_hash = ? AND sessions.expires_at > ?`,
    )
    .get(hashToken(token), now.toISOString());

  return row && userSchema.parse(row);
}
