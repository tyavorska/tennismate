// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { db } from '../db/db';
import { createSessionToken } from '../testing/sessions';
import { createPlayer } from '../testing/players';
import { findUserBySessionToken } from './sessionToken';
import { deleteAccount } from './deleteAccount';
import { findUserByEmail } from './users';

function count(sql: string, ...params: string[]): number {
  const row = db.prepare(sql).get(...params);
  return Number(Object.values(row ?? {})[0]);
}

describe('deleteAccount', () => {
  it('removes the user, the profile and the sessions', async () => {
    const user = await createPlayer('gone@example.com');
    const token = createSessionToken(user);

    expect(await deleteAccount(user, 'serve-and-volley')).toBe(true);

    expect(findUserByEmail('gone@example.com')).toBeUndefined();
    expect(
      count('SELECT COUNT(*) FROM users WHERE id = ? AND deleted_at IS NOT NULL', user.id),
    ).toBe(1);
    expect(findUserBySessionToken(token)).toBeUndefined();
    expect(count('SELECT COUNT(*) FROM profiles WHERE user_id = ?', user.id)).toBe(0);
  });

  it('frees the email for a new account', async () => {
    const user = await createPlayer('again@example.com');

    await deleteAccount(user, 'serve-and-volley');

    await expect(createPlayer('again@example.com')).resolves.toBeDefined();
  });

  it('keeps the account for a wrong password', async () => {
    const user = await createPlayer('stays@example.com');

    expect(await deleteAccount(user, 'wrong-password')).toBe(false);

    expect(findUserByEmail('stays@example.com')).toBeDefined();
  });

  it('leaves other players and their data alone', async () => {
    const leaving = await createPlayer('leaving@example.com');
    const other = await createPlayer('other@example.com');
    db.prepare('INSERT INTO saved_players (user_id, player_id, created_at) VALUES (?, ?, ?)').run(
      other.id,
      leaving.id,
      new Date().toISOString(),
    );

    expect(await deleteAccount(leaving, 'serve-and-volley')).toBe(true);

    expect(findUserByEmail('other@example.com')).toBeDefined();
    expect(count('SELECT COUNT(*) FROM profiles WHERE user_id = ?', other.id)).toBe(1);
    expect(count('SELECT COUNT(*) FROM saved_players WHERE player_id = ?', leaving.id)).toBe(0);
    expect(db.prepare('PRAGMA foreign_key_check').all()).toEqual([]);
  });
});
