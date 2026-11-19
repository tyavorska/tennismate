import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/server/auth';
import { listDistricts } from '@/server/courts';
import { getProfile } from '@/server/profiles';
import { ProfilePage } from '@/views/profile';
import { routes } from '@/shared/config';

export const metadata: Metadata = { title: 'Profile settings | Let.' };

export default async function Page() {
  const user = await getCurrentUser();
  if (user === undefined) redirect(routes.signIn);
  const viewer = getProfile(user);
  if (viewer === undefined) redirect(routes.chooseCity);

  return (
    <ProfilePage viewer={viewer} email={user.email} districts={listDistricts(viewer.city.id)} />
  );
}
