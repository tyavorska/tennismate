import { describe, expect, it } from 'vitest';
import { hashPassword, verifyPassword } from './password';

describe('password hashing', () => {
  it('accepts the password that was hashed', async () => {
    const hash = await hashPassword('correct horse');
    expect(await verifyPassword('correct horse', hash)).toBe(true);
  });

  it('rejects a different password', async () => {
    const hash = await hashPassword('correct horse');
    expect(await verifyPassword('wrong horse', hash)).toBe(false);
  });

  it('never stores the password itself', async () => {
    expect(await hashPassword('correct horse')).not.toContain('correct horse');
  });

  it('salts each hash, so the same password gives different hashes', async () => {
    expect(await hashPassword('same')).not.toBe(await hashPassword('same'));
  });

  it('rejects a malformed stored hash instead of throwing', async () => {
    expect(await verifyPassword('anything', 'not-a-hash')).toBe(false);
  });
});
