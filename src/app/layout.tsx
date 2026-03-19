import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { HtmlLangSync } from '@/components/html-lang-sync';
import { getSiteName, getFaviconInfo } from '@/server/services/settings-public.service';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
  display: 'swap',
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
  display: 'swap',
});

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  try {
    const [siteName, favicon] = await Promise.all([
      getSiteName(),
      getFaviconInfo(),
    ]);
    return {
      title: siteName,
      description: siteName,
      ...(favicon && {
        icons: {
          icon: { url: favicon.url, type: favicon.type },
          apple: favicon.url,
        },
      }),
    };
  } catch {
    return { title: 'Vela' };
  }
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0a0a' },
  ],
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        <HtmlLangSync />
      </body>
    </html>
  );
}
