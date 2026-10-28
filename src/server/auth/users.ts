import 'server-only';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { userIdSchema, userSchema, type Credentials, type User } from '@/entities/user';
import { db } from '../db/db';
import { hashPassword } from './password';

const userRowSchema = userSchema.extend({ password_hash: z.string() });

type UserRow = z.infer<typeof userRowSchema>;

export class EmailTakenError extends Error {
  constructor() {
    super('Email is already registered');
    this.name = 'EmailTakenError';
  }
}

export function toUser(row: Pick<UserRow, 'id' | 'email'>): User {
  return { id: row.id, email: row.email };
}

export function findUserByEmail(email: string): UserRow | undefined {
  const row = db.prepare('SELECT id, email, password_hash FROM users WHERE email = ?').get(email);
  return row && userRowSchema.parse(row);
}

function isUniqueViolation(error: Error): boolean {
  return 'code' in error && error.code === 'ERR_SQLITE_ERROR' && /UNIQUE/.test(error.message);
}

export async function createUser({ email, password }: Credentials): Promise<User> {
  const id = userIdSchema.parse(randomUUID());
  const passwordHash = await hashPassword(password);

  try {
    db.prepare('INSERT INTO users (id, email, password_hash, created_at) VALUES (?, ?, ?, ?)').run(
      id,
      email,
      passwordHash,
      new Date().toISOString(),
    );
  } catch (error) {
    // Also catches two sign-ups with the same email racing each other.
    if (error instanceof Error && isUniqueViolation(error)) throw new EmailTakenError();
    throw error;
  }

  return { id, email };
}
