import type { Metadata } from 'next';
import { CourtsPage } from '@/views/courts';

export const metadata: Metadata = { title: 'Courts | TennisMate' };

export default function Page() {
  return <CourtsPage />;
}
