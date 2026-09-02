'use client';

import Link from 'next/link';
import { AlertTriangle, Check, RefreshCw, TrendingDown, TrendingUp } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { DashboardData, RiskEvent } from '@/lib/types';
import { AppShell } from './AppShell';
import { PortfolioTrendChart, RevenueMixChart } from './Charts';
import { formatTime, formatUsd } from './Format';
import { DashboardSkeleton } from './Skeleton';

const toneClass = (value: number) => value >= 0 ? 'positive' : 'danger';

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const response = await fetch('/api/dashboard', { cache: 'no-store' });
      if (!response.ok) throw new Error('Dashboard API is unavailable');
      setData(await response.json() as DashboardData);
      setError('');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to load dashboard');
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    // This effect intentionally synchronizes the client with the dashboard API.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
    const timer = window.setInterval(() => void load(true), 30_000);
    return () => window.clearInterval(timer);
  }, [load]);

  const refresh = async () => {
    setRefreshing(true);
    setNotice('');
    try {
      const response = await fetch('/api/refresh', { method: 'POST', headers: { 'Content-Type': 'application/json' } });
      const payload = await response.json() as { error?: string; retryAfter?: number };
      if (!response.ok) {
        setNotice(payload.retryAfter ? `Next refresh is available in ${payload.retryAfter}s.` : (payload.error ?? 'Refresh failed.'));
        return;
      }
      await load(true);
      setNotice('A new synthetic market snapshot was stored.');
    } finally {
      setRefreshing(false);
    }
  };

  const acknowledge = async (event: RiskEvent) => {
    const response = await fetch(`/api/events/${event.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'acknowledged' }),
    });
    if (response.ok) await load(true);
  };

  const metrics = useMemo(() => data ? [
    { label: 'Total deposits', value: formatUsd(data.summary.totalDeposits), detail: 'Across 6 monitored markets', tone: 'positive' },
    { label: 'Total borrows', value: formatUsd(data.summary.totalBorrows), detail: `${data.summary.utilization.toFixed(1)}% capital utilization`, tone: 'positive' },
    { label: 'Health score', value: `${data.summary.healthScore} / 100`, detail: `${data.summary.badDebtRatio.toFixed(3)}% bad debt ratio`, tone: 'neutral' },
    { label: 'Open risk events', value: String(data.summary.openEvents), detail: `${data.summary.criticalEvents} critical signals`, tone: data.summary.criticalEvents ? 'danger' : 'positive' },
  ] : [], [data]);

  return (
    <AppShell
      eyebrow="Risk command center"
      title="Portfolio overview"
      description="Live operational view of lending exposure, market health, protocol revenue, and alert response."
      actions={
        <>
          <span className="sync-label">30s auto-refresh</span>
          <button className="primary-button" disabled={refreshing} onClick={refresh}>
            <RefreshCw aria-hidden="true" className={refreshing ? 'spin' : ''} size={14} />
            {refreshing ? 'Refreshing…' : 'Refresh data'}
          </button>
        </>
      }
    >
      {notice ? <div className="notice" role="status">{notice}</div> : null}
      {error ? <div className="error-banner" role="alert"><AlertTriangle size={16} />{error}<button onClick={() => void load()}>Try again</button></div> : null}
      {loading ? <DashboardSkeleton /> : data ? (
        <>
          <section className="metric-grid" aria-label="Portfolio metrics">
            {metrics.map((metric) => (
              <article className="metric-card" key={metric.label}>
                <div className="metric-heading"><span>{metric.label}</span><i className={`metric-signal ${metric.tone}`} /></div>
                <strong>{metric.value}</strong>
                <small className={metric.tone}>{metric.detail}</small>
              </article>
            ))}
          </section>

          <section className="dashboard-grid">
            <article className="panel trend-panel">
              <div className="panel-heading">
                <div><p className="eyebrow">Capital activity</p><h2>Deposits and borrows</h2></div>
                <span className="panel-meta">30-day trend</span>
              </div>
              <PortfolioTrendChart snapshots={data.snapshots} />
            </article>
            <article className="panel revenue-panel" id="revenue">
              <div className="panel-heading">
                <div><p className="eyebrow">Revenue mix</p><h2>24h protocol income</h2></div>
                <strong className="panel-total">{formatUsd(data.summary.revenue24h, 0)}</strong>
              </div>
              <RevenueMixChart values={data.revenueMix} />
            </article>
          </section>

          <section className="dashboard-grid lower-grid">
            <article className="panel markets-panel">
              <div className="panel-heading">
                <div><p className="eyebrow">Exposure</p><h2>Market risk monitor</h2></div>
                <Link className="text-button" href="/markets">View all markets →</Link>
              </div>
              <div className="table-wrap">
                <table>
                  <thead><tr><th>Market</th><th>Deposits</th><th>Borrows</th><th>Utilization</th><th>24h</th><th>Status</th></tr></thead>
                  <tbody>{data.markets.slice(0, 5).map((market) => (
                    <tr key={market.id}>
                      <td><span className="asset-icon">{market.symbol.slice(0, 1)}</span><div><strong>{market.symbol}</strong><small>{market.chain}</small></div></td>
                      <td>{formatUsd(market.totalDeposits)}</td><td>{formatUsd(market.totalBorrows)}</td><td>{market.utilization.toFixed(1)}%</td>
                      <td className={toneClass(market.change24h)}>{market.change24h >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}{Math.abs(market.change24h).toFixed(2)}%</td>
                      <td><span className={`risk-badge ${market.status}`}>{market.status}</span></td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            </article>

            <article className="panel events-panel">
              <div className="panel-heading">
                <div><p className="eyebrow">Latest signals</p><h2>Risk event stream</h2></div>
                <Link className="event-count" href="/events">{data.summary.openEvents} open</Link>
              </div>
              <div className="event-list">{data.events.slice(0, 5).map((event) => (
                <div className="event-row event-row-action" key={event.id}>
                  <span className={`severity-dot ${event.severity}`} />
                  <div><strong>{event.title}</strong><small>{event.detail}</small></div>
                  {event.status === 'open' ? (
                    <button aria-label={`Acknowledge ${event.title}`} className="ack-button" onClick={() => void acknowledge(event)} title="Acknowledge event"><Check size={13} /></button>
                  ) : <time>{formatTime(event.occurredAt)}</time>}
                </div>
              ))}</div>
            </article>
          </section>
          <p className="data-timestamp">Snapshot generated {formatTime(data.generatedAt)} · Values are synthetic and designed for portfolio demonstration.</p>
        </>
      ) : null}
    </AppShell>
  );
}
