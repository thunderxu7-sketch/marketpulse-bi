import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] });
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] });
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: 'MarketPulse BI — Financial Risk Observatory',
  description: 'A full-stack financial monitoring and business intelligence portfolio project.',
  applicationName: 'MarketPulse BI',
  openGraph: {
    type: 'website',
    title: 'MarketPulse BI',
    description: 'Financial Risk Observatory — live portfolio health, exposure, revenue, and alert operations.',
    images: [{ url: '/og.png', width: 1200, height: 630, alt: 'MarketPulse BI — Financial Risk Observatory' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'MarketPulse BI',
    description: 'Financial Risk Observatory — live portfolio health, exposure, revenue, and alert operations.',
    images: ['/og.png'],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>{children}</body>
    </html>
  );
}
