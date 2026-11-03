import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/server/auth';
import { listDistricts } from '@/server/courts';
import { getViewer } from '@/server/players';
import { ProfilePage } from '@/views/profile';

export const metadata: Metadata = { title: 'Profile settings | Let.' };

export default async function Page() {
  const [viewer, user] = await Promise.all([getViewer(), getCurrentUser()]);
  if (viewer === undefined || user === undefined) redirect('/sign-in');

  return (
    <ProfilePage viewer={viewer} email={user.email} districts={listDistricts(viewer.city.id)} />
  );
}
