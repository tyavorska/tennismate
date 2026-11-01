import type { ReactNode } from 'react';
import styles from './Card.module.css';

type CardProps = {
  as?: 'div' | 'li' | 'section';
  /** Set `--card-pad` or `--card-gap` on a parent class to change the spacing. */
  className?: string;
  'aria-labelledby'?: string;
  children: ReactNode;
};

/** Cream content card from the Let. design. Stays cream in both themes. */
export function Card({ as: Tag = 'div', className, children, ...props }: CardProps) {
  return (
    <Tag className={[styles.card, className].filter(Boolean).join(' ')} {...props}>
      {children}
    </Tag>
  );
}
