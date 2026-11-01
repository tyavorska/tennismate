import type { ReactNode } from 'react';
import styles from './Eyebrow.module.css';

type EyebrowProps = {
  as?: 'p' | 'span' | 'h2' | 'h3';
  /** `onDark` for navy bands. Set `--eyebrow-color` on a parent class for any other colour. */
  tone?: 'default' | 'onDark';
  id?: string;
  className?: string;
  children: ReactNode;
};

/** Small uppercase label that sits above a heading or inside a card. */
export function Eyebrow({
  as: Tag = 'p',
  tone = 'default',
  id,
  className,
  children,
}: EyebrowProps) {
  const classes = [styles.eyebrow, tone === 'onDark' ? styles.onDark : '', className]
    .filter(Boolean)
    .join(' ');
  return (
    <Tag id={id} className={classes}>
      {children}
    </Tag>
  );
}
