// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { db } from './db';
import { seedDemoData } from './seed';

const now = new Date('2026-11-02T11:00:00.000Z');

function gameIds(): readonly string[] {
  return db
    .prepare('SELECT id FROM games ORDER BY id')
    .all()
    .map((row) => String(row.id));
}

describe('seedDemoData', () => {
  it('adds the demo players and games', () => {
    seedDemoData(db, now);

    const players = db.prepare('SELECT COUNT(*) AS total FROM profiles').get();
    expect(players?.total).toBe(24);
    expect(gameIds()).toHaveLength(8);
  });

  it('keeps the games, and who joined them, when it runs again', () => {
    seedDemoData(db, now);
    const before = gameIds();
    db.prepare(
      `INSERT INTO game_participants (game_id, user_id, joined_at)
       VALUES (?, '00000000-0000-4000-8000-000000000001', ?)`,
    ).run(before[0] ?? '', now.toISOString());

    seedDemoData(db, now);

    expect(gameIds()).toEqual(before);
    const joined = db.prepare('SELECT COUNT(*) AS total FROM game_participants').get();
    expect(joined?.total).toBe(1);
  });

  it('replaces the games once they have all passed', () => {
    seedDemoData(db, now);
    const before = gameIds();

    seedDemoData(db, new Date('2027-03-01T11:00:00.000Z'));

    expect(gameIds()).toHaveLength(8);
    expect(gameIds()).not.toEqual(before);
  });

  it('gives demo players a password that never matches', () => {
    seedDemoData(db, now);

    const hashes = db
      .prepare("SELECT DISTINCT password_hash AS hash FROM users WHERE email LIKE '%@demo.invalid'")
      .all();
    expect(hashes.map((row) => row.hash)).toEqual(['!']);
  });
});
