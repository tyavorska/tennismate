import 'server-only';
import { randomBytes, scrypt, timingSafeEqual, type BinaryLike } from 'node:crypto';

const keyLength = 64;
const saltLength = 16;

function deriveKey(password: BinaryLike, salt: Buffer): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(password, salt, keyLength, (error, key) => (error ? reject(error) : resolve(key)));
  });
}

/** Stored as `salt:key`, both hex. */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(saltLength);
  const key = await deriveKey(password, salt);
  return `${salt.toString('hex')}:${key.toString('hex')}`;
}

export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  const [saltHex, keyHex] = storedHash.split(':');
  if (saltHex === undefined || keyHex === undefined) return false;

  const expected = Buffer.from(keyHex, 'hex');
  const actual = await deriveKey(password, Buffer.from(saltHex, 'hex'));
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

// Checked when the email is unknown, so a missing account takes as long as a wrong password.
export const dummyPasswordHash: Promise<string> = hashPassword(randomBytes(16).toString('hex'));
