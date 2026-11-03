import 'server-only';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { calendarEventSchema, type CalendarEvent } from '@/entities/game';
import {
  gameFormatLabels,
  gameFormatSchema,
  initialsOf,
  openGameSchema,
  type NewGame,
  type OpenGame,
} from '@/entities/player';
import type { User } from '@/entities/user';
import {
  addDays,
  isoDateSchema,
  krakowToUtc,
  toKrakowWallClock,
  todayInKrakow,
  type IsoDate,
} from '@/shared/lib';
import { db, transaction } from '../db';
import { DomainError } from '../http';
import { ensureProfile } from '../profiles';
import { dateForDay, dayOfDate, finderDays } from './schedule';

const spotsByFormat = { singles: 1, doubles: 3, hitting: 1 } as const satisfies Record<
  z.infer<typeof gameFormatSchema>,
  number
>;

const gameRowSchema = z.object({
  id: z.string(),
  host_id: z.string(),
  host_name: z.string(),
  court: z.string(),
  district: z.string(),
  starts_at: z.string(),
  format: gameFormatSchema,
  rating: z.number(),
  spots: z.number(),
  taken: z.number(),
  joined: z.number(),
});
type GameRow = z.infer<typeof gameRowSchema>;

const selectGames = `
  SELECT games.id, games.host_id, profiles.name AS host_name, courts.name AS court,
         courts.district, games.starts_at, games.format, games.rating, games.spots,
         (SELECT COUNT(*) FROM game_participants WHERE game_id = games.id) AS taken,
         EXISTS (SELECT 1 FROM game_participants
                 WHERE game_id = games.id AND user_id = ?) AS joined
  FROM games
  JOIN profiles ON profiles.user_id = games.host_id
  JOIN courts ON courts.id = games.court_id`;

function toOpenGame(row: GameRow, viewerId: string, today: IsoDate): OpenGame | undefined {
  const { date, time } = toKrakowWallClock(new Date(row.starts_at));
  const day = dayOfDate(date, today);
  if (day === undefined) return undefined;

  const isMine = row.host_id === viewerId;
  return openGameSchema.parse({
    id: row.id,
    hostName: isMine ? 'You' : row.host_name,
    hostInitials: isMine ? 'You' : initialsOf(row.host_name),
    rating: row.rating,
    format: row.format,
    day,
    time,
    court: row.court,
    district: row.district,
    spotsOpen: Math.max(0, row.spots - row.taken),
    isMine,
    isJoined: row.joined === 1,
  });
}

function findGameRow(viewerId: string, gameId: string): GameRow | undefined {
  const row = db.prepare(`${selectGames} WHERE games.id = ?`).get(viewerId, gameId);
  return row && gameRowSchema.parse(row);
}

function requireGame(viewerId: string, gameId: string): GameRow {
  const row = findGameRow(viewerId, gameId);
  if (row === undefined)
    throw new DomainError('notFound', { message: 'This game no longer exists.' });
  return row;
}

function requireOpenGame(viewerId: string, gameId: string, today: IsoDate): OpenGame {
  const game = toOpenGame(requireGame(viewerId, gameId), viewerId, today);
  if (game === undefined)
    throw new DomainError('notFound', { message: 'This game is no longer listed.' });
  return game;
}

/** Games from now until the end of the week the finder covers, soonest first. */
export function listOpenGames(user: User, now: Date = new Date()): readonly OpenGame[] {
  ensureProfile(user);
  const today = todayInKrakow(now);
  const until = krakowToUtc(addDays(today, finderDays + 1), '00:00').toISOString();
  const rows = db
    .prepare(
      `${selectGames} WHERE games.starts_at >= ? AND games.starts_at < ? ORDER BY games.starts_at`,
    )
    .all(user.id, now.toISOString(), until);

  return z
    .array(gameRowSchema)
    .parse(rows)
    .flatMap((row) => toOpenGame(row, user.id, today) ?? []);
}

export function createGame(user: User, input: NewGame, now: Date = new Date()): OpenGame {
  ensureProfile(user);
  const court = db.prepare('SELECT id FROM courts WHERE name = ?').get(input.court);
  if (court === undefined) {
    throw new DomainError('validation', {
      fieldErrors: { court: 'Choose a court from the list.' },
    });
  }

  const today = todayInKrakow(now);
  const startsAt = krakowToUtc(dateForDay(input.day, today), input.time);
  if (startsAt.getTime() <= now.getTime()) {
    throw new DomainError('validation', {
      fieldErrors: { time: 'Choose a time that has not passed.' },
    });
  }

  const id = randomUUID();
  db.prepare(
    `INSERT INTO games (id, host_id, court_id, starts_at, format, rating, spots, looking_for, note, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    id,
    user.id,
    z.number().parse(court.id),
    startsAt.toISOString(),
    input.format,
    input.rating,
    spotsByFormat[input.format],
    input.lookingFor,
    input.note.trim(),
    now.toISOString(),
  );
  return requireOpenGame(user.id, id, today);
}

export function deleteGame(user: User, gameId: string): void {
  const game = requireGame(user.id, gameId);
  if (game.host_id !== user.id) {
    throw new DomainError('forbidden', { message: 'Only the host can remove this game.' });
  }
  db.prepare('DELETE FROM games WHERE id = ?').run(gameId);
}

/** Taking a spot is one statement, so two players cannot both get the last one. */
export function joinGame(user: User, gameId: string, now: Date = new Date()): OpenGame {
  ensureProfile(user);
  const today = todayInKrakow(now);

  transaction(db, () => {
    const game = requireGame(user.id, gameId);
    if (game.host_id === user.id) {
      throw new DomainError('conflict', { message: 'You are hosting this game.' });
    }
    if (new Date(game.starts_at).getTime() <= now.getTime()) {
      throw new DomainError('conflict', { message: 'This game has already started.' });
    }
    if (game.joined === 1) return;

    const { changes } = db
      .prepare(
        `INSERT INTO game_participants (game_id, user_id, joined_at)
         SELECT ?, ?, ?
         WHERE (SELECT COUNT(*) FROM game_participants WHERE game_id = ?) <
               (SELECT spots FROM games WHERE id = ?)`,
      )
      .run(gameId, user.id, now.toISOString(), gameId, gameId);
    if (changes === 0) throw new DomainError('conflict', { message: 'This game is full.' });
  });

  return requireOpenGame(user.id, gameId, today);
}

export function leaveGame(user: User, gameId: string, now: Date = new Date()): OpenGame {
  requireGame(user.id, gameId);
  db.prepare('DELETE FROM game_participants WHERE game_id = ? AND user_id = ?').run(
    gameId,
    user.id,
  );
  return requireOpenGame(user.id, gameId, todayInKrakow(now));
}

const maxCalendarDays = 62;

const tournamentRowSchema = z.object({
  id: z.string(),
  name: z.string(),
  date: isoDateSchema,
  venue: z.string(),
});

function toCalendarEvent(row: GameRow, viewerId: string): CalendarEvent | undefined {
  const { date, time } = toKrakowWallClock(new Date(row.starts_at));
  const format = gameFormatLabels[row.format];
  const base = { id: row.id, date, time, court: row.court };

  if (row.host_id === viewerId) {
    return calendarEventSchema.parse({
      ...base,
      kind: 'game',
      title: `${format} game`,
      confirmed: row.taken > 0,
    });
  }
  if (row.joined === 1) {
    return calendarEventSchema.parse({
      ...base,
      kind: 'game',
      title: row.host_name,
      confirmed: true,
    });
  }
  if (row.taken >= row.spots) return undefined;
  return calendarEventSchema.parse({ ...base, kind: 'open', host: row.host_name, format });
}

/** The viewer's games, other players' games with a spot left, and tournaments, for `from` to `to`. */
export function listCalendarEvents(
  user: User,
  from: IsoDate,
  to: IsoDate,
): readonly CalendarEvent[] {
  ensureProfile(user);
  const spanDays = (Date.parse(to) - Date.parse(from)) / 86_400_000;
  if (spanDays < 0 || spanDays > maxCalendarDays) {
    throw new DomainError('validation', {
      fieldErrors: { to: 'Choose a range of up to two months.' },
    });
  }

  const gameRows = db
    .prepare(
      `${selectGames} WHERE games.starts_at >= ? AND games.starts_at < ? ORDER BY games.starts_at`,
    )
    .all(
      user.id,
      krakowToUtc(from, '00:00').toISOString(),
      krakowToUtc(addDays(to, 1), '00:00').toISOString(),
    );
  const tournamentRows = db
    .prepare(
      `SELECT tournaments.id, tournaments.name, tournaments.date, courts.name AS venue
       FROM tournaments JOIN courts ON courts.id = tournaments.court_id
       WHERE tournaments.date >= ? AND tournaments.date <= ?`,
    )
    .all(from, to);

  const games = z
    .array(gameRowSchema)
    .parse(gameRows)
    .flatMap((row) => toCalendarEvent(row, user.id) ?? []);
  const tournaments = z
    .array(tournamentRowSchema)
    .parse(tournamentRows)
    .map((row) => calendarEventSchema.parse({ ...row, kind: 'tournament' }));
  return [...games, ...tournaments];
}
