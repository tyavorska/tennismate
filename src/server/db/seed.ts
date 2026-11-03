import 'server-only';
import { randomUUID } from 'node:crypto';
import type { DatabaseSync, SQLOutputValue } from 'node:sqlite';
import { z } from 'zod';
import { krakowToUtc, nextWeekday, todayInKrakow, addDays } from '@/shared/lib';
import { demoGames, demoPlayers, demoTournaments } from './demoData';
import { courts, districts } from './referenceData';
import { transaction } from './transaction';

const dayMs = 86_400_000;

/** Placeholder hash with no `:`, so no password ever matches and nobody can sign in as a demo player. */
const unusableHash = '!';

function countOf(row: Record<string, SQLOutputValue> | undefined): number {
  return z.object({ total: z.number() }).parse(row).total;
}

export function demoUserId(slug: string): string {
  const index = demoPlayers.findIndex((candidate) => candidate.slug === slug);
  return `00000000-0000-4000-8000-${String(index + 1).padStart(12, '0')}`;
}

export function seedReferenceData(database: DatabaseSync): void {
  const insertDistrict = database.prepare(
    'INSERT OR IGNORE INTO districts (name, latitude, longitude) VALUES (?, ?, ?)',
  );
  const insertCourt = database.prepare(
    'INSERT OR IGNORE INTO courts (name, district) VALUES (?, ?)',
  );

  transaction(database, () => {
    districts.forEach(({ name, latitude, longitude }) =>
      insertDistrict.run(name, latitude, longitude),
    );
    courts.forEach(({ name, district }) => insertCourt.run(name, district));
  });
}

/** Players, open games and tournaments to try the app with. Games are placed relative to today. */
export function seedDemoData(database: DatabaseSync, now: Date): void {
  const insertUser = database.prepare(
    'INSERT OR IGNORE INTO users (id, email, password_hash, created_at) VALUES (?, ?, ?, ?)',
  );
  const insertProfile = database.prepare(
    `INSERT OR IGNORE INTO profiles
       (user_id, name, district, rating, age, play_style, formats, times,
        free_tonight, wants_doubles_partner, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  );
  const upcomingDemoGames = database.prepare(
    `SELECT COUNT(*) AS total FROM games
     WHERE starts_at >= ? AND host_id IN (SELECT id FROM users WHERE email LIKE '%@demo.invalid')`,
  );
  const deleteDemoGames = database.prepare(
    "DELETE FROM games WHERE host_id IN (SELECT id FROM users WHERE email LIKE '%@demo.invalid')",
  );
  const insertGame = database.prepare(
    `INSERT INTO games (id, host_id, court_id, starts_at, format, rating, spots, looking_for, note, created_at)
     VALUES (?, ?, (SELECT id FROM courts WHERE name = ?), ?, ?, ?, ?, 'nearLevel', '', ?)`,
  );
  const upcomingTournaments = database.prepare(
    'SELECT COUNT(*) AS total FROM tournaments WHERE date >= ?',
  );
  const deleteTournaments = database.prepare('DELETE FROM tournaments');
  const insertTournament = database.prepare(
    'INSERT INTO tournaments (id, name, court_id, date) VALUES (?, ?, (SELECT id FROM courts WHERE name = ?), ?)',
  );

  const today = todayInKrakow(now);
  const nowIso = now.toISOString();

  transaction(database, () => {
    demoPlayers.forEach((demo) => {
      const id = demoUserId(demo.slug);
      const joined = demo.isNew ? nowIso : new Date(now.getTime() - 90 * dayMs).toISOString();
      const formats = demo.formats === 'both' ? ['singles', 'doubles'] : [demo.formats];
      const times = [
        ...(demo.mornings ? ['mornings'] : []),
        ...(demo.weekends ? ['weekends'] : []),
      ];
      insertUser.run(id, `${demo.slug}@demo.invalid`, unusableHash, joined);
      insertProfile.run(
        id,
        demo.name,
        demo.district,
        demo.rating,
        demo.age,
        demo.playStyle,
        JSON.stringify(formats),
        JSON.stringify(times),
        Number(demo.freeTonight),
        Number(demo.wantsDoublesPartner),
        joined,
        joined,
      );
    });

    // Only replaced once they have all passed, so joining a demo game is not undone by a restart.
    if (countOf(upcomingDemoGames.get(nowIso)) === 0) {
      deleteDemoGames.run();
      demoGames.forEach((game) => {
        const date =
          game.daysAhead === 'saturday' ? nextWeekday(today, 5) : addDays(today, game.daysAhead);
        insertGame.run(
          randomUUID(),
          demoUserId(game.host),
          game.court,
          krakowToUtc(date, game.time).toISOString(),
          game.format,
          game.rating,
          game.spots,
          nowIso,
        );
      });
    }

    if (countOf(upcomingTournaments.get(today)) === 0) {
      deleteTournaments.run();
      demoTournaments.forEach((tournament) =>
        insertTournament.run(
          randomUUID(),
          tournament.name,
          tournament.court,
          addDays(today, tournament.daysAhead),
        ),
      );
    }
  });
}
