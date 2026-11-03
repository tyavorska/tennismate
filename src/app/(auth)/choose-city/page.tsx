import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/server/auth';
import { listCities } from '@/server/cities';
import { getProfile } from '@/server/profiles';
import { ChooseCityPage } from '@/views/choose-city';

export const metadata: Metadata = { title: 'Choose your city | Let.' };

export default async function Page() {
  const user = await getCurrentUser();
  if (user === undefined) redirect('/sign-in');
  // A player who already has a city has nothing to choose here.
  if (getProfile(user) !== undefined) redirect('/players');

  return <ChooseCityPage cities={listCities()} />;
}
