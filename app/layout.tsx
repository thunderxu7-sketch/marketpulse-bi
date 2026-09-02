import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { I18nProvider } from '@/components/I18n';
import './globals.css';

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] });
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] });
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://thunderxu7-sketch.github.io/marketpulse-bi/';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: 'MarketPulse BI — 金融风险监控平台',
  description: '支持中英文切换的全栈金融风险监控与商业智能作品集。',
  applicationName: 'MarketPulse BI',
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    url: '/',
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
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable}`}><I18nProvider>{children}</I18nProvider></body>
    </html>
  );
}
