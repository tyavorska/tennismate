import type { ReactNode } from 'react';
import { Header } from '@/widgets/header';

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <Header />
      {children}
    </>
  );
}
