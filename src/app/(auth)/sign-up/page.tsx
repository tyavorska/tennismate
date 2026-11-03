import type { Metadata } from 'next';
import { listCities } from '@/server/cities';
import { SignUpPage } from '@/views/sign-up';

export const metadata: Metadata = { title: 'Sign up | Let.' };

export default function Page() {
  return <SignUpPage cities={listCities()} />;
}
