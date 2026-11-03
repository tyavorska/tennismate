// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { ntrpRatingSchema } from '@/entities/player';
import { createUser } from '../auth';
import { DomainError } from '../http';
import { addCity } from '../testing/cities';
import { createPlayer, krakowId } from '../testing/players';
import { createProfile, getProfile, requireProfile, updateProfile } from './profiles';

const rating = ntrpRatingSchema.parse(4);
const gdansk = addCity('gdansk');

function kindOfError(work: () => void): string | undefined {
  try {
    work();
  } catch (error) {
    return error instanceof DomainError ? error.kind : 'other';
  }
  return undefined;
}

describe('createProfile', () => {
  it('gives a new account a starter profile in the chosen city, named from the email', async () => {
    const user = await createUser({ email: 'ana.smith@example.com', password: 'serve-and-volley' });

    expect(createProfile(user, krakowId())).toEqual({
      id: user.id,
      name: 'Ana Smith',
      rating: 3,
      neighborhood: 'Stare Miasto',
      city: { id: krakowId(), name: 'Kraków', timezone: 'Europe/Warsaw' },
    });
  });

  it('starts the profile in another city when that one is chosen', async () => {
    const user = await createUser({ email: 'gd@example.com', password: 'serve-and-volley' });

    expect(createProfile(user, gdansk.id)).toMatchObject({
      city: { id: gdansk.id },
      neighborhood: gdansk.district,
    });
  });

  it('refuses a city that does not exist, and creates nothing', async () => {
    const user = await createUser({ email: 'nowhere@example.com', password: 'serve-and-volley' });

    expect(kindOfError(() => createProfile(user, 9999))).toBe('validation');
    expect(getProfile(user)).toBe(undefined);
  });

  it('refuses a second profile, so the city cannot be changed this way', async () => {
    const user = await createPlayer('twice@example.com');

    expect(kindOfError(() => createProfile(user, gdansk.id))).toBe('conflict');
    expect(requireProfile(user).city.id).toBe(krakowId());
  });
});

describe('requireProfile', () => {
  it('answers forbidden for an account that has not chosen a city', async () => {
    const user = await createUser({ email: 'nocity@example.com', password: 'serve-and-volley' });

    expect(getProfile(user)).toBe(undefined);
    expect(kindOfError(() => requireProfile(user))).toBe('forbidden');
  });
});

describe('updateProfile', () => {
  it('saves the new name, district and level', async () => {
    const user = await createPlayer('cleo@example.com');

    expect(updateProfile(user, { name: 'Cleo C.', neighborhood: 'Podgórze', rating })).toEqual({
      id: user.id,
      name: 'Cleo C.',
      rating: 4,
      neighborhood: 'Podgórze',
      city: { id: krakowId(), name: 'Kraków', timezone: 'Europe/Warsaw' },
    });
  });

  it('rejects a district that is not in the list and names the field', async () => {
    const user = await createPlayer('dan@example.com');

    expect(
      kindOfError(() => updateProfile(user, { name: 'Dan', neighborhood: 'Atlantis', rating })),
    ).toBe('validation');
    expect(requireProfile(user).neighborhood).toBe('Stare Miasto');
  });
});
