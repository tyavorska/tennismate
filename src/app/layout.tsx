import type { Metadata } from 'next';
import { themeInitScript } from '@/features/toggle-theme';
import { InlineScript } from '@/shared/ui';
import './globals.css';

export const metadata: Metadata = {
  title: 'TennisMate',
  description: 'Find tennis partners and organize matches.',
};

export default function RootLayout({ children, auth }: LayoutProps<'/'>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <InlineScript html={themeInitScript} />
      </head>
      <body>
        {children}
        {auth}
      </body>
    </html>
  );
}
