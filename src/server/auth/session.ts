import 'server-only';
import { createHash, randomBytes } from 'node:crypto';
import { cookies } from 'next/headers';
import { cache } from 'react';
import { userSchema, type User, type UserId } from '@/entities/user';
import { sessionCookieName } from '@/shared/config';
import { serverEnv } from '../config/env';
import { db } from '../db/db';

const sessionLifetimeMs = 30 * 24 * 60 * 60 * 1000;

// Only the hash is stored, so a leaked database cannot be used to sign in.
function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export async function createSession(userId: UserId): Promise<void> {
  const token = randomBytes(32).toString('base64url');
  const now = new Date();
  const expiresAt = new Date(now.getTime() + sessionLifetimeMs);

  db.prepare(
    'INSERT INTO sessions (token_hash, user_id, expires_at, created_at) VALUES (?, ?, ?, ?)',
  ).run(hashToken(token), userId, expiresAt.toISOString(), now.toISOString());

  const cookieStore = await cookies();
  cookieStore.set(sessionCookieName, token, {
    httpOnly: true,
    secure: serverEnv.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    expires: expiresAt,
  });
}

// Cached per request so layouts and pages can all call it.
export const getCurrentUser = cache(async (): Promise<User | undefined> => {
  const token = (await cookies()).get(sessionCookieName)?.value;
  if (token === undefined) return undefined;

  const row = db
    .prepare(
      `SELECT users.id, users.email FROM sessions
       JOIN users ON users.id = sessions.user_id
       WHERE sessions.token_hash = ? AND sessions.expires_at > ?`,
    )
    .get(hashToken(token), new Date().toISOString());

  return row && userSchema.parse(row);
});

export async function deleteSession(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(sessionCookieName)?.value;
  if (token !== undefined) {
    db.prepare('DELETE FROM sessions WHERE token_hash = ?').run(hashToken(token));
  }
  cookieStore.delete(sessionCookieName);
}
