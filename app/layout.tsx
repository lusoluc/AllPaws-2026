import type { Metadata, Viewport } from 'next';
import './globals.css';
import ClientInitializer from '@/components/ClientInitializer';

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
      <body className="h-full bg-zinc-900 text-zinc-100 antialiased selection:bg-brandpink-500 selection:text-white">
        <ClientInitializer />
        {children}
      </body>
    </html>
  );
}
