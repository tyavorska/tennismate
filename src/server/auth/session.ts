import 'server-only';
import { randomBytes } from 'node:crypto';
import { cookies } from 'next/headers';
import { cache } from 'react';
import type { User, UserId } from '@/entities/user';
import { sessionCookieName } from '@/shared/config';
import { serverEnv } from '../config/env';
import { db } from '../db/db';
import { findUserBySessionToken, hashToken } from './sessionToken';

const sessionLifetimeMs = 30 * 24 * 60 * 60 * 1000;

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

  return findUserBySessionToken(token);
});

export async function deleteSession(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(sessionCookieName)?.value;
  if (token !== undefined) {
    db.prepare('DELETE FROM sessions WHERE token_hash = ?').run(hashToken(token));
  }
  cookieStore.delete(sessionCookieName);
}
