import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'TennisMate',
  description: 'Find tennis partners and organize matches.',
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
