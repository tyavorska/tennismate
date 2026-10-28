import 'server-only';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { serverEnv } from '../config/env';

const schema = `
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
`;

function openDatabase(path: string): DatabaseSync {
  if (path !== ':memory:') mkdirSync(dirname(path), { recursive: true });
  const database = new DatabaseSync(path);
  database.exec('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');
  database.exec(schema);
  return database;
}

// Reuse one connection across dev hot reloads instead of opening a new one per reload.
declare global {
  var tennismateDb: DatabaseSync | undefined;
}

export const db: DatabaseSync = globalThis.tennismateDb ?? openDatabase(serverEnv.DATABASE_PATH);

if (serverEnv.NODE_ENV !== 'production') globalThis.tennismateDb = db;
