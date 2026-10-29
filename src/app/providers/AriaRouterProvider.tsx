'use client';

import { useRouter } from 'next/navigation';
import type { ReactNode } from 'react';
import { RouterProvider } from 'react-aria-components';

/** Lets React Aria links (menu items with an href) navigate on the client like next/link. */
export function AriaRouterProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  return <RouterProvider navigate={(href) => router.push(href)}>{children}</RouterProvider>;
}
