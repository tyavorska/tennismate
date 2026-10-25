import type { Metadata } from 'next';
import { themeInitScript } from '@/features/toggle-theme';
import { InlineScript } from '@/shared/ui';
import { Header } from '@/widgets/header';
import './globals.css';

export const metadata: Metadata = {
  title: 'TennisMate',
  description: 'Find tennis partners and organize matches.',
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <InlineScript html={themeInitScript} />
      </head>
      <body>
        <Header />
        {children}
      </body>
    </html>
  );
}
