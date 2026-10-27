import type { Metadata } from 'next';
import { SignUpPage } from '@/views/sign-up';

export const metadata: Metadata = { title: 'Sign up | TennisMate' };

export default function Page() {
  return <SignUpPage />;
}
