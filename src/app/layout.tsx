import type { Metadata } from 'next';
import { themeInitScript } from '@/features/toggle-theme';
import { InlineScript } from '@/shared/ui';
import { QueryProvider } from './providers';
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
        <QueryProvider>
          {children}
          {auth}
        </QueryProvider>
      </body>
    </html>
  );
}
