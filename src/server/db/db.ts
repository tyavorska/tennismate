import 'server-only';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { serverEnv } from '../config/env';
import { migrate } from './migrate';
import { seedDemoData, seedReferenceData } from './seed';

function openDatabase(path: string): DatabaseSync {
  if (path !== ':memory:') mkdirSync(dirname(path), { recursive: true });
  const database = new DatabaseSync(path);
  database.exec('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');
  return database;
}

// Safe to repeat, so a reused connection also picks up tables and data added since it was opened.
function initialize(database: DatabaseSync): DatabaseSync {
  migrate(database);
  seedReferenceData(database);
  if (serverEnv.NODE_ENV === 'development') seedDemoData(database, new Date());
  return database;
}

// Reuse one connection across dev hot reloads instead of opening a new one per reload.
declare global {
  var tennismateDb: DatabaseSync | undefined;
}

export const db: DatabaseSync = initialize(
  globalThis.tennismateDb ?? openDatabase(serverEnv.DATABASE_PATH),
);

if (serverEnv.NODE_ENV !== 'production') globalThis.tennismateDb = db;
