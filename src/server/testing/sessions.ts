import 'server-only';
import { randomBytes } from 'node:crypto';
import type { User } from '@/entities/user';
import { db } from '../db';
import { hashToken } from '../auth/sessionToken';

/** A signed-in session for a test, without the cookie store a request would have. Returns the token. */
export function createSessionToken(user: User): string {
  const token = randomBytes(32).toString('base64url');
  const now = new Date();
  db.prepare(
    'INSERT INTO sessions (token_hash, user_id, expires_at, created_at) VALUES (?, ?, ?, ?)',
  ).run(
    hashToken(token),
    user.id,
    new Date(now.getTime() + 60_000).toISOString(),
    now.toISOString(),
  );
  return token;
}
