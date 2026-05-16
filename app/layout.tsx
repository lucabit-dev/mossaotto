import type { Metadata } from 'next';
import { GetSongBpmAttribution } from '@/components/GetSongBpmAttribution';
import './globals.css';

export const metadata: Metadata = {
  title: 'MOSSA OTTO — Music Library',
  description: 'Shared DJ track library with realtime sync and Soulseek export',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body style={{ minHeight: '100%', display: 'flex', flexDirection: 'column' }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>{children}</div>
        <GetSongBpmAttribution />
      </body>
    </html>
  );
}
