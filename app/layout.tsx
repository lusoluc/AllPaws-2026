import type { Metadata, Viewport } from 'next';
import './globals.css';
import ClientInitializer from '@/components/ClientInitializer';
import { APP_VERSION } from '@/lib/version';

export const metadata: Metadata = {
  title: 'Būk mano draugas - Tiererfassung & Vermittlung',
  description: 'Mobile-First Tiererfassungs-App für das Tierheim Būk mano draugas',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'BMD Erfassung',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#4c1d95',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="de" className="h-full">
      <body className="h-full bg-zinc-900 text-zinc-100 antialiased selection:bg-brandpink-500 selection:text-white relative">
        <ClientInitializer />
        {children}
        <div className="fixed bottom-1.5 right-2 text-[9px] text-stone-500/40 select-none pointer-events-none z-50 font-mono">
          v{APP_VERSION}
        </div>
      </body>
    </html>
  );
}
