import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Wahid & Wasiq AI Studio',
  description: 'Multi-provider free-tier AI studio by Wahid & Wasiq — intelligent routing across Groq, Gemini, OpenRouter and more.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
