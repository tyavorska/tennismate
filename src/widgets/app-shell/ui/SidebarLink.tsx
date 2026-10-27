'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import styles from './AppShell.module.css';

type SidebarLinkProps = {
  href: string;
  icon: ReactNode;
  children: ReactNode;
};

export function SidebarLink({ href, icon, children }: SidebarLinkProps) {
  const pathname = usePathname();
  const isActive = pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Link href={href} className={styles.link} aria-current={isActive ? 'page' : undefined}>
      <span className={styles.icon}>{icon}</span>
      <span className={styles.label}>{children}</span>
    </Link>
  );
}
