// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { authenticate } from './signIn';
import { createUser, EmailTakenError } from './users';

describe('authenticate', () => {
  it('returns the user for the right email and password', async () => {
    const created = await createUser({ email: 'ana@example.com', password: 'serve-and-volley' });
    expect(await authenticate({ email: 'ana@example.com', password: 'serve-and-volley' })).toEqual(
      created,
    );
  });

  it('returns nothing for a wrong password', async () => {
    await createUser({ email: 'ben@example.com', password: 'serve-and-volley' });
    expect(await authenticate({ email: 'ben@example.com', password: 'wrong-password' })).toBe(
      undefined,
    );
  });

  it('returns nothing for an email with no account', async () => {
    expect(await authenticate({ email: 'nobody@example.com', password: 'whatever1' })).toBe(
      undefined,
    );
  });
});

describe('createUser', () => {
  it('refuses a second account with the same email', async () => {
    await createUser({ email: 'cleo@example.com', password: 'serve-and-volley' });
    await expect(
      createUser({ email: 'cleo@example.com', password: 'another-password' }),
    ).rejects.toBeInstanceOf(EmailTakenError);
  });
});
