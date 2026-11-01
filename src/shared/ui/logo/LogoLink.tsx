import Link from 'next/link';
import { Logo } from './Logo';
import styles from './LogoLink.module.css';

type LogoLinkProps = {
  href: string;
  className?: string;
};

/** The wordmark as a link home. Cream, for navy bars; size it with --logo-size on `className`. */
export function LogoLink({ href, className }: LogoLinkProps) {
  return (
    <Link
      href={href}
      className={[styles.link, className].filter(Boolean).join(' ')}
      aria-label="Let. home"
    >
      <Logo />
    </Link>
  );
}
