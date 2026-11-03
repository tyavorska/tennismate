import 'server-only';
import type { Migration } from './migration';

/** The schema as it was before migrations existed. Databases that already have it only get the version number. */
export const baseline: Migration = {
  version: 1,
  name: 'baseline',
  up: (database) => {
    database.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS sessions (
    token_hash TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at TEXT NOT NULL,
    created_at TEXT NOT NULL
  );

  CREATE INDEX IF NOT EXISTS sessions_user_id ON sessions(user_id);

  CREATE TABLE IF NOT EXISTS districts (
    name TEXT PRIMARY KEY,
    latitude REAL NOT NULL,
    longitude REAL NOT NULL
  );

  CREATE TABLE IF NOT EXISTS courts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    district TEXT NOT NULL REFERENCES districts(name)
  );

  CREATE TABLE IF NOT EXISTS profiles (
    user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    district TEXT NOT NULL REFERENCES districts(name),
    rating REAL NOT NULL,
    age INTEGER,
    play_style TEXT,
    formats TEXT NOT NULL,
    times TEXT NOT NULL,
    free_tonight INTEGER NOT NULL DEFAULT 0,
    wants_doubles_partner INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS saved_players (
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    player_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TEXT NOT NULL,
    PRIMARY KEY (user_id, player_id)
  );

  CREATE TABLE IF NOT EXISTS games (
    id TEXT PRIMARY KEY,
    host_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    court_id INTEGER NOT NULL REFERENCES courts(id),
    starts_at TEXT NOT NULL,
    format TEXT NOT NULL,
    rating REAL NOT NULL,
    spots INTEGER NOT NULL CHECK (spots >= 1),
    looking_for TEXT NOT NULL,
    note TEXT NOT NULL,
    created_at TEXT NOT NULL
  );

  CREATE INDEX IF NOT EXISTS games_starts_at ON games(starts_at);

  CREATE TABLE IF NOT EXISTS game_participants (
    game_id TEXT NOT NULL REFERENCES games(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    joined_at TEXT NOT NULL,
    PRIMARY KEY (game_id, user_id)
  );

  CREATE TABLE IF NOT EXISTS tournaments (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    court_id INTEGER NOT NULL REFERENCES courts(id),
    date TEXT NOT NULL
  );
`);
  },
};
