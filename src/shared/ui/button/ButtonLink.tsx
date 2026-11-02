import Link from 'next/link';
import type { ReactNode } from 'react';
import styles from './Button.module.css';

type ButtonLinkProps = {
  href: string;
  variant?: 'ball' | 'outlineOnDark';
  className?: string;
  children: ReactNode;
};

/** A link that looks like a pill button. Use it to navigate; use `Button` for actions. */
export function ButtonLink({ href, variant = 'ball', className, children }: ButtonLinkProps) {
  const classes = [styles.button, styles.link, styles[variant], className]
    .filter(Boolean)
    .join(' ');
  // Hash links stay native anchors so the page can react to them without a route change.
  if (href.includes('#')) {
    return (
      <a href={href} className={classes}>
        {children}
      </a>
    );
  }
  return (
    <Link href={href} className={classes}>
      {children}
    </Link>
  );
}
