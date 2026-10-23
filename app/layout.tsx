import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Free-Tier AI Studio',
  description: 'Multi-provider free-tier AI aggregation with intelligent routing — chat, script, code, research at zero cost.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
