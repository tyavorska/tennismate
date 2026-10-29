import type { Metadata } from 'next';
import { Archivo } from 'next/font/google';
import { themeInitScript } from '@/features/toggle-theme';
import { InlineScript } from '@/shared/ui';
import { AriaRouterProvider, QueryProvider } from './providers';
import './globals.css';

// Variable font: regular weights for body text, heavy italic for the sporty display type.
const sansFont = Archivo({
  subsets: ['latin'],
  style: ['normal', 'italic'],
  variable: '--font-sans',
});

export const metadata: Metadata = {
  title: 'TennisMate',
  description: 'Find tennis partners and organize matches.',
};

export default function RootLayout({ children, auth }: LayoutProps<'/'>) {
  return (
    <html lang="en" className={sansFont.variable} suppressHydrationWarning>
      <head>
        <InlineScript html={themeInitScript} />
      </head>
      <body>
        <QueryProvider>
          <AriaRouterProvider>
            {children}
            {auth}
          </AriaRouterProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
