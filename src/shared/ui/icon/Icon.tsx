import type { ReactNode } from 'react';

const paths = {
  chevron: <path d="M6 9l6 6 6-6" />,
  check: <path d="M5 12.5l4.5 4.5L19 7.5" />,
  arrowLeft: <path d="M15 6l-6 6 6 6" />,
  arrowRight: <path d="M9 6l6 6-6 6" />,
  search: (
    <>
      <circle cx="11" cy="11" r="6" />
      <path d="M20 20l-4.2-4.2" />
    </>
  ),
  bookmark: <path d="M7 4h10v16l-5-4-5 4z" />,
  close: <path d="M6 6l12 12M18 6L6 18" />,
  messages: <path d="M4 5h16v11H9l-5 4z" />,
  send: <path d="M5 12h14M13 6l6 6-6 6" />,
  plus: <path d="M12 3v18M3 12h18" />,
  calendar: <path d="M4 6h16v14H4zM4 10h16M9 3v4M15 3v4" />,
  user: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4 3.6-6 8-6s8 2 8 6" />
    </>
  ),
  help: <path d="M9 9a3 3 0 1 1 4 2.8c-.6.3-1 .9-1 1.6V15M12 18.5v.5" />,
} as const satisfies Record<string, ReactNode>;

export type IconName = keyof typeof paths;

type IconProps = {
  name: IconName;
  /** Fills the shape with the current colour. */
  filled?: boolean;
  strokeWidth?: number;
  className?: string;
};

export function Icon({ name, filled = false, strokeWidth = 2.2, className }: IconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      width="1em"
      height="1em"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {paths[name]}
    </svg>
  );
}
