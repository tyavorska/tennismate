import { redirect } from 'next/navigation';
import type { ReactNode } from 'react';
import { getViewer } from '@/server/players';
import { AppShell } from '@/widgets/app-shell';

export default async function AppLayout({ children }: { children: ReactNode }) {
  // The proxy only checked that a cookie exists; this checks that the session is real.
  const viewer = await getViewer();
  if (viewer === undefined) redirect('/sign-in');

  return <AppShell viewer={viewer}>{children}</AppShell>;
}
