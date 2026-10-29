'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import styles from './AppShell.module.css';

type NavLinkProps = {
  href: string;
  icon: ReactNode;
  children: ReactNode;
};

export function NavLink({ href, icon, children }: NavLinkProps) {
  const pathname = usePathname();
  const isActive = pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Link href={href} className={styles.link} aria-current={isActive ? 'page' : undefined}>
      <span className={styles.icon}>{icon}</span>
      {children}
    </Link>
  );
}
