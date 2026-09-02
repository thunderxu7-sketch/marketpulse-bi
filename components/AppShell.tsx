'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Activity,
  BellRing,
  Database,
  Github,
  LayoutDashboard,
  LineChart,
  Settings2,
} from 'lucide-react';
import type { ReactNode } from 'react';

const navigation = [
  { href: '/', label: 'Overview', icon: LayoutDashboard },
  { href: '/markets', label: 'Markets', icon: LineChart },
  { href: '/events', label: 'Risk events', icon: BellRing },
  { href: '/rules', label: 'Alert rules', icon: Settings2 },
  { href: '/api-status', label: 'API status', icon: Database },
];

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
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <Link className="brand-row" href="/" aria-label="MarketPulse BI home">
          <span className="brand-mark">M</span>
          <div><strong>MarketPulse</strong><span>Financial BI</span></div>
        </Link>
        <nav aria-label="Primary navigation">
          <p className="nav-label">Workspace</p>
          {navigation.slice(0, 3).map(({ href, label, icon: Icon }) => (
            <Link className={`nav-item ${pathname === href ? 'active' : ''}`} href={href} key={href}>
              <Icon aria-hidden="true" size={16} strokeWidth={1.8} />{label}
            </Link>
          ))}
          <p className="nav-label">Manage</p>
          {navigation.slice(3).map(({ href, label, icon: Icon }) => (
            <Link className={`nav-item ${pathname === href ? 'active' : ''}`} href={href} key={href}>
              <Icon aria-hidden="true" size={16} strokeWidth={1.8} />{label}
            </Link>
          ))}
        </nav>
        <a className="source-link" href="https://github.com/thunderxu7-sketch/marketpulse-bi" target="_blank" rel="noreferrer">
          <Github aria-hidden="true" size={15} />View source
        </a>
        <div className="sidebar-note">
          <span className="live-dot" />
          <div><strong>Monitoring active</strong><small>Cloud API + D1 database</small></div>
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
          <span><Activity aria-hidden="true" size={14} /> Synthetic portfolio data · Educational demo</span>
          <span>React · TypeScript · ECharts · Cloudflare D1</span>
        </footer>
      </main>
    </div>
  );
}
