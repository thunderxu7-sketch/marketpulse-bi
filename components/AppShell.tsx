'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Activity,
  BellRing,
  Bot,
  CircleDollarSign,
  Database,
  Github,
  LayoutDashboard,
  Languages,
  LineChart,
  RadioTower,
  Scale,
  Settings2,
  ShieldAlert,
  Users,
  Waves,
} from 'lucide-react';
import type { ReactNode } from 'react';
import { useI18n } from './I18n';

export function AppShell({
  eyebrow,
  title,
  description,
  actions,
  children,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const { language, t, toggleLanguage } = useI18n();
  const isPages = typeof window !== 'undefined' && (
    window.location.hostname.endsWith('github.io') || window.location.pathname.startsWith('/marketpulse-bi')
  );
  const navigation = [
    { label: t('workspace'), links: [{ href: '/', label: t('navOverview'), icon: LayoutDashboard }] },
    { label: t('navDataMonitoring'), links: [
      { href: '/markets', label: t('navMarkets'), icon: LineChart },
      { href: '/price-feeds', label: t('navPriceFeeds'), icon: RadioTower },
      { href: '/bad-debt', label: t('navBadDebt'), icon: ShieldAlert },
      { href: '/automation', label: t('navAutomation'), icon: Bot },
    ] },
    { label: t('navFundMonitoring'), links: [
      { href: '/fund-flows', label: t('navFundFlows'), icon: Waves },
      { href: '/revenue', label: t('navRevenue'), icon: CircleDollarSign },
    ] },
    { label: t('navEventCenter'), links: [
      { href: '/liquidations', label: t('navLiquidations'), icon: Scale },
      { href: '/events', label: t('navEvents'), icon: BellRing },
    ] },
    { label: t('navAdministration'), links: [
      { href: '/rules', label: t('navRules'), icon: Settings2 },
      { href: '/team', label: t('navTeam'), icon: Users },
      { href: '/api-status', label: t('navApi'), icon: Database },
    ] },
  ];
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <Link className="brand-row" href="/" aria-label="MarketPulse BI">
          <span className="brand-mark">M</span>
          <div><strong>MarketPulse</strong><span>{t('brandSubtitle')}</span></div>
        </Link>
        <nav aria-label="Primary navigation">
          {navigation.map((group) => <div className="nav-group" key={group.label}>
            <p className="nav-label">{group.label}</p>
            {group.links.map(({ href, label, icon: Icon }) => (
              <Link className={`nav-item ${pathname === href ? 'active' : ''}`} href={href} key={href}>
                <Icon aria-hidden="true" size={16} strokeWidth={1.8} />{label}
              </Link>
            ))}
          </div>)}
        </nav>
        <div className="sidebar-actions">
          <button
            aria-label={language === 'zh' ? t('switchToEnglish') : t('switchToChinese')}
            className="language-toggle"
            onClick={toggleLanguage}
            type="button"
          >
            <Languages aria-hidden="true" size={15} />
            <span className={language === 'zh' ? 'active' : ''}>中</span><i />
            <span className={language === 'en' ? 'active' : ''}>EN</span>
          </button>
          <a className="source-link" href="https://github.com/thunderxu7-sketch/marketpulse-bi" target="_blank" rel="noreferrer">
            <Github aria-hidden="true" size={15} />{t('viewSource')}
          </a>
        </div>
        <div className="sidebar-note">
          <span className="live-dot" />
          <div><strong>{t('monitoringActive')}</strong><small>{t(isPages ? 'pagesStorage' : 'cloudStorage')}</small></div>
        </div>
      </aside>

      <main className="main-panel">
        <header className="topbar">
          <div>
            <p className="eyebrow">{eyebrow}</p>
            <h1>{title}</h1>
            {description ? <p className="page-description">{description}</p> : null}
          </div>
          {actions ? <div className="top-actions">{actions}</div> : null}
        </header>
        {children}
        <footer className="site-footer">
          <span><Activity aria-hidden="true" size={14} /> {t('footerData')}</span>
          <span>{t(isPages ? 'footerPagesStack' : 'footerStack')}</span>
        </footer>
      </main>
    </div>
  );
}
