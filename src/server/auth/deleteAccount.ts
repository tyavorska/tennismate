import 'server-only';
import type { User } from '@/entities/user';
import { db } from '../db/db';
import { transaction } from '../db/transaction';
import { verifyPassword } from './password';
import { findUserByEmail } from './users';

const noPasswordHash = '!';

/**
 * Deletes the account after checking the password. Returns `false` for a wrong password and
 * changes nothing. The profile, saved players, games the person hosted, their place in other
 * games, open invites and sessions are removed. The `users` row stays as an anonymous tombstone
 * (`deleted_at`, no email, a hash no password matches), so conversations keep their history and
 * show the other player a deleted account.
 */
export async function deleteAccount(
  user: User,
  password: string,
  now: Date = new Date(),
): Promise<boolean> {
  const row = findUserByEmail(user.email);
  if (row === undefined || row.id !== user.id) return false;
  if (!(await verifyPassword(password, row.password_hash))) return false;

  const timestamp = now.toISOString();
  transaction(db, () => {
    db.prepare(
      `UPDATE game_invites SET status = 'cancelled', responded_at = ?
       WHERE (proposer_id = ? OR invitee_id = ?)
         AND status IN ('pending', 'accepted') AND starts_at > ?`,
    ).run(timestamp, user.id, user.id, timestamp);
    db.prepare('DELETE FROM games WHERE host_id = ?').run(user.id);
    db.prepare('DELETE FROM game_participants WHERE user_id = ?').run(user.id);
    db.prepare('DELETE FROM saved_players WHERE user_id = ? OR player_id = ?').run(
      user.id,
      user.id,
    );
    db.prepare('DELETE FROM sessions WHERE user_id = ?').run(user.id);
    db.prepare('DELETE FROM profiles WHERE user_id = ?').run(user.id);
    db.prepare('UPDATE users SET email = ?, password_hash = ?, deleted_at = ? WHERE id = ?').run(
      `deleted-${user.id}@deleted.invalid`,
      noPasswordHash,
      timestamp,
      user.id,
    );
  });
  return true;
}
