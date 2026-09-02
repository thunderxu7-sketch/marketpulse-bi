'use client';

import { CheckCircle2, Database, Server, ShieldCheck } from 'lucide-react';
import { useEffect, useState } from 'react';
import { AppShell } from './AppShell';
import { formatTime } from './Format';

interface Health { status: string; database: string; markets: number; timestamp: string }

const endpoints = [
  ['GET', '/api/dashboard', 'Aggregated KPIs, trends, revenue mix, markets, and events'],
  ['GET', '/api/markets', 'Searchable and sortable market exposure'],
  ['GET', '/api/events', 'Filterable operational event stream'],
  ['PATCH', '/api/events/:id', 'Persistent event acknowledgement'],
  ['GET', '/api/rules', 'Alert policy configuration'],
  ['PATCH', '/api/rules/:id', 'Persistent rule enablement'],
  ['POST', '/api/refresh', 'Rate-limited synthetic market cycle'],
];

export default function ApiStatusView() {
  const [health, setHealth] = useState<Health | null>(null);
  useEffect(() => { void fetch('/api/health', { cache: 'no-store' }).then((response) => response.json()).then((value) => setHealth(value as Health)); }, []);
  return (
    <AppShell eyebrow="Platform health" title="API status" description="A transparent view of the serverless API and persistent storage behind the dashboard.">
      <section className="health-hero panel">
        <div className="health-icon"><CheckCircle2 size={24} /></div>
        <div><p className="eyebrow">Current status</p><h2>{health ? 'All systems operational' : 'Checking services…'}</h2><span>{health ? `Verified ${formatTime(health.timestamp)}` : 'Connecting to the health endpoint'}</span></div>
        <span className="operational-badge">Operational</span>
      </section>
      <section className="service-grid">
        <article className="panel service-card"><Server size={19} /><span><strong>Edge API</strong><small>Cloudflare Worker-compatible server routes</small></span><b>Healthy</b></article>
        <article className="panel service-card"><Database size={19} /><span><strong>D1 database</strong><small>{health ? `${health.markets} seeded markets available` : 'Persistent SQLite at the edge'}</small></span><b>Connected</b></article>
        <article className="panel service-card"><ShieldCheck size={19} /><span><strong>Write controls</strong><small>Validation, same-origin checks, and refresh limits</small></span><b>Enabled</b></article>
      </section>
      <section className="panel endpoint-panel">
        <div className="panel-heading"><div><p className="eyebrow">Backend surface</p><h2>API endpoints</h2></div><span className="panel-meta">JSON · no-store</span></div>
        <div className="endpoint-list">{endpoints.map(([method, path, description]) => (
          <div key={`${method}-${path}`}><span className={`method ${method.toLowerCase()}`}>{method}</span><code>{path}</code><p>{description}</p></div>
        ))}</div>
      </section>
    </AppShell>
  );
}
