'use client';

import { Button as AriaButton, type ButtonProps as AriaButtonProps } from 'react-aria-components';
import styles from './Button.module.css';

type ButtonProps = Omit<AriaButtonProps, 'className'> & {
  variant?: 'primary' | 'secondary' | 'ghost';
  className?: string;
};

export function Button({ variant = 'primary', className, ...props }: ButtonProps) {
  const classes = [styles.button, styles[variant], className].filter(Boolean).join(' ');
  return <AriaButton {...props} className={classes} />;
}
