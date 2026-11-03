import 'server-only';
import { cache } from 'react';
import { z } from 'zod';
import {
  matchTimeSchema,
  playerListingSchema,
  playFormatSchema,
  type Player,
  type PlayerListing,
} from '@/entities/player';
import type { User } from '@/entities/user';
import { getCurrentUser } from '../auth';
import { db } from '../db';
import { DomainError } from '../http';
import { getProfile, requireProfile } from '../profiles';
import { distanceKm } from '@/shared/lib';
import { fitPercent } from './matching';

const newPlayerDays = 14;
const dayMs = 86_400_000;

const listingRowSchema = z.object({
  id: z.string(),
  name: z.string(),
  age: z.number().nullable(),
  rating: z.number(),
  district: z.string(),
  latitude: z.number(),
  longitude: z.number(),
  play_style: z.string().nullable(),
  formats: z.string(),
  times: z.string(),
  free_tonight: z.number(),
  wants_doubles_partner: z.number(),
  created_at: z.string(),
});

const formatsSchema = z.array(playFormatSchema).min(1);
const timesSchema = z.array(matchTimeSchema);

const defaultPlayStyle = 'Social';

/** The signed-in user's player profile. Cached per request. */
export const getViewer = cache(async (): Promise<Player | undefined> => {
  const user = await getCurrentUser();
  return user && getProfile(user);
});

function parseJsonColumn(text: string): z.core.util.JSONType {
  return JSON.parse(text);
}

function toListing(
  row: z.infer<typeof listingRowSchema>,
  viewer: Readonly<{ rating: number; latitude: number; longitude: number }>,
  now: Date,
): PlayerListing {
  const km = distanceKm(viewer, row);
  const joinedMs = new Date(row.created_at).getTime();
  return playerListingSchema.parse({
    id: row.id,
    name: row.name,
    age: row.age ?? undefined,
    rating: row.rating,
    district: row.district,
    distanceKm: km,
    fitPercent: fitPercent(viewer.rating, row.rating, km),
    playStyle: row.play_style ?? defaultPlayStyle,
    formats: formatsSchema.parse(parseJsonColumn(row.formats)),
    times: timesSchema.parse(parseJsonColumn(row.times)),
    freeTonight: row.free_tonight === 1,
    online: false,
    isNew: now.getTime() - joinedMs < newPlayerDays * dayMs,
    wantsDoublesPartner: row.wants_doubles_partner === 1,
  });
}

/** Everyone else in the viewer's city, with distance and fit worked out from the viewer's district. */
export function listPlayers(user: User, now: Date = new Date()): readonly PlayerListing[] {
  const { city } = requireProfile(user);
  const viewerRow = db
    .prepare(
      `SELECT profiles.rating, districts.latitude, districts.longitude FROM profiles
       JOIN districts ON districts.id = profiles.district_id WHERE profiles.user_id = ?`,
    )
    .get(user.id);
  const viewer = z
    .object({ rating: z.number(), latitude: z.number(), longitude: z.number() })
    .parse(viewerRow);

  const rows = db
    .prepare(
      `SELECT profiles.user_id AS id, profiles.name, profiles.age, profiles.rating,
              districts.name AS district, districts.latitude, districts.longitude,
              profiles.play_style, profiles.formats, profiles.times, profiles.free_tonight,
              profiles.wants_doubles_partner, profiles.created_at
       FROM profiles JOIN districts ON districts.id = profiles.district_id
       WHERE profiles.city_id = ? AND profiles.user_id != ?`,
    )
    .all(city.id, user.id);

  return z
    .array(listingRowSchema)
    .parse(rows)
    .map((row) => toListing(row, viewer, now));
}

/** Saved players in the viewer's city. Those in another city stay saved but are not shown. */
export function listSavedPlayerIds(user: User): readonly string[] {
  const { city } = requireProfile(user);
  const rows = db
    .prepare(
      `SELECT saved_players.player_id FROM saved_players
       JOIN profiles ON profiles.user_id = saved_players.player_id
       WHERE saved_players.user_id = ? AND profiles.city_id = ?
       ORDER BY saved_players.created_at`,
    )
    .all(user.id, city.id);
  return z.array(z.string()).parse(rows.map((row) => row.player_id));
}

export function savePlayer(user: User, playerId: string): void {
  if (playerId === user.id) {
    throw new DomainError('validation', { message: 'You cannot save your own profile.' });
  }
  const { city } = requireProfile(user);
  // A player in another city looks the same as one that does not exist.
  const player = db
    .prepare('SELECT 1 AS found FROM profiles WHERE user_id = ? AND city_id = ?')
    .get(playerId, city.id);
  if (player === undefined) {
    throw new DomainError('notFound', { message: 'This player no longer exists.' });
  }

  db.prepare(
    'INSERT OR IGNORE INTO saved_players (user_id, player_id, created_at) VALUES (?, ?, ?)',
  ).run(user.id, playerId, new Date().toISOString());
}

export function unsavePlayer(user: User, playerId: string): void {
  db.prepare('DELETE FROM saved_players WHERE user_id = ? AND player_id = ?').run(
    user.id,
    playerId,
  );
}
