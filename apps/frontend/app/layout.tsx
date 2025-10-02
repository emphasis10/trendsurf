import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'TrendSurf',
  description: 'Track topic-specific paper trends with AI summaries and novelty scores.'
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
