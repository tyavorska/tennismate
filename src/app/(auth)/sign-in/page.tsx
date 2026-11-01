import type { Metadata } from 'next';
import { SignInPage } from '@/views/sign-in';

export const metadata: Metadata = { title: 'Sign in | Let.' };

export default function Page({ searchParams }: PageProps<'/sign-in'>) {
  return <SignInPage searchParams={searchParams} />;
}
