// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { ntrpRatingSchema } from '@/entities/player';
import { createUser } from '../auth';
import { DomainError } from '../http';
import { ensureProfile, updateProfile } from './profiles';

const rating = ntrpRatingSchema.parse(4);

describe('ensureProfile', () => {
  it('gives a new account a starter profile named from the email', async () => {
    const user = await createUser({ email: 'ana.smith@example.com', password: 'serve-and-volley' });

    expect(ensureProfile(user)).toEqual({
      id: user.id,
      name: 'Ana Smith',
      rating: 3,
      neighborhood: 'Stare Miasto',
      city: { id: expect.any(Number), name: 'Kraków' },
    });
  });

  it('keeps the profile it already made', async () => {
    const user = await createUser({ email: 'ben@example.com', password: 'serve-and-volley' });
    updateProfile(user, { name: 'Ben B.', neighborhood: 'Kazimierz', rating });

    expect(ensureProfile(user).name).toBe('Ben B.');
  });
});

describe('updateProfile', () => {
  it('saves the new name, district and level', async () => {
    const user = await createUser({ email: 'cleo@example.com', password: 'serve-and-volley' });

    expect(updateProfile(user, { name: 'Cleo C.', neighborhood: 'Podgórze', rating })).toEqual({
      id: user.id,
      name: 'Cleo C.',
      rating: 4,
      neighborhood: 'Podgórze',
      city: { id: expect.any(Number), name: 'Kraków' },
    });
  });

  it('rejects a district that is not in the list and names the field', async () => {
    const user = await createUser({ email: 'dan@example.com', password: 'serve-and-volley' });

    expect(() => updateProfile(user, { name: 'Dan', neighborhood: 'Atlantis', rating })).toThrow(
      DomainError,
    );
    expect(ensureProfile(user).neighborhood).toBe('Stare Miasto');
  });
});
