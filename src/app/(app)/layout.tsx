import { redirect } from 'next/navigation';
import type { ReactNode } from 'react';
import { getCurrentUser } from '@/server/auth';
import { AppShell } from '@/widgets/app-shell';

export default async function AppLayout({ children }: { children: ReactNode }) {
  // The proxy only checked that a cookie exists; this checks that the session is real.
  const user = await getCurrentUser();
  if (user === undefined) redirect('/sign-in');

  return <AppShell>{children}</AppShell>;
}
