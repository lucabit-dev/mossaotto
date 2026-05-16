import type { Metadata } from 'next';
import { ThemeScript } from '@/components/ThemeScript';
import './globals.css';

export const metadata: Metadata = {
  title: 'MOSSA OTTO — Music Library',
  description: 'Shared DJ track library with realtime sync and Soulseek export',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full" data-theme="dark" suppressHydrationWarning>
      <body style={{ minHeight: '100%' }}>
        <ThemeScript />
        {children}
      </body>
    </html>
  );
}
