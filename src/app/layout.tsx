import type { Metadata } from 'next';
import { Manrope, Sofia_Sans_Extra_Condensed } from 'next/font/google';
import { themeInitScript } from '@/features/toggle-theme';
import { InlineScript } from '@/shared/ui';
import { AriaRouterProvider, QueryProvider } from './providers';
import './globals.css';

// Manrope for body text, extra-condensed Sofia Sans for headings and the wordmark.
const bodyFont = Manrope({
  subsets: ['latin', 'latin-ext'],
  variable: '--font-manrope',
});

const displayFont = Sofia_Sans_Extra_Condensed({
  subsets: ['latin', 'latin-ext'],
  weight: ['600', '700', '800'],
  variable: '--font-sofia',
});

export const metadata: Metadata = {
  title: 'Let.',
  description: 'Find tennis partners and organize matches.',
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html
      lang="en"
      className={`${bodyFont.variable} ${displayFont.variable}`}
      suppressHydrationWarning
    >
      <head>
        <InlineScript html={themeInitScript} />
      </head>
      <body>
        <QueryProvider>
          <AriaRouterProvider>{children}</AriaRouterProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
