import 'server-only';
import type { Credentials, User } from '@/entities/user';
import { dummyPasswordHash, verifyPassword } from './password';
import { toUser, findUserByEmail } from './users';

export async function authenticate({ email, password }: Credentials): Promise<User | undefined> {
  const row = findUserByEmail(email);
  const passwordMatches = await verifyPassword(
    password,
    row?.password_hash ?? (await dummyPasswordHash),
  );
  return row !== undefined && passwordMatches ? toUser(row) : undefined;
}
