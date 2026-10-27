import type { Metadata } from 'next';
import { DashboardPage } from '@/views/dashboard';

export const metadata: Metadata = { title: 'Home | TennisMate' };

export default function Page() {
  return <DashboardPage />;
}
