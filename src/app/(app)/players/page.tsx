import type { Metadata } from 'next';
import { PlayersPage } from '@/views/players';

export const metadata: Metadata = { title: 'Players | Let.' };

export default function Page() {
  return <PlayersPage />;
}
