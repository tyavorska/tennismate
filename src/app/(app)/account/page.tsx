import type { Metadata } from 'next';
import { AccountPage } from '@/views/account';

export const metadata: Metadata = { title: 'Account | TennisMate' };

export default function Page() {
  return <AccountPage />;
}
