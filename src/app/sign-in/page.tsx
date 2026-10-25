import type { Metadata } from 'next';
import { SignInPage } from '@/views/sign-in';

export const metadata: Metadata = { title: 'Sign in | TennisMate' };

export default function Page() {
  return <SignInPage />;
}
