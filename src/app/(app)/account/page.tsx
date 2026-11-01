import type { Metadata } from 'next';
import { AccountPage } from '@/views/account';

export const metadata: Metadata = { title: 'Account | Let.' };

export default function Page() {
  return <AccountPage />;
}
