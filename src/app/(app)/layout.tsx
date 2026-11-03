import { redirect } from 'next/navigation';
import type { ReactNode } from 'react';
import { getCurrentUser } from '@/server/auth';
import { getViewer } from '@/server/players';
import { AppShell } from '@/widgets/app-shell';

export default async function AppLayout({ children }: { children: ReactNode }) {
  // The proxy only checked that a cookie exists; this checks that the session is real.
  if ((await getCurrentUser()) === undefined) redirect('/sign-in');

  // Everything in the app is limited to one city, so a player without one picks it first.
  const viewer = await getViewer();
  if (viewer === undefined) redirect('/choose-city');

  return <AppShell viewer={viewer}>{children}</AppShell>;
}
