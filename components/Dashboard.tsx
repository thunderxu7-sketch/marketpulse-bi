'use client';

import Link from 'next/link';
import { AlertTriangle, Check, RefreshCw, TrendingDown, TrendingUp } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { DashboardData, RiskEvent } from '@/lib/types';
import { AppShell } from './AppShell';
import { PortfolioTrendChart, RevenueMixChart } from './Charts';
import { formatTime, formatUsd } from './Format';
import { useI18n } from './I18n';
import { localizeEvent, localizeRevenueName, marketStatusLabel } from './Localize';
import { DashboardSkeleton } from './Skeleton';

const toneClass = (value: number) => value >= 0 ? 'positive' : 'danger';

export default function Dashboard() {
  const { language, locale, t } = useI18n();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const response = await fetch('/api/dashboard', { cache: 'no-store' });
      if (!response.ok) throw new Error(t('dashboardUnavailable'));
      setData(await response.json() as DashboardData);
      setError('');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : t('dashboardLoadFailed'));
    } finally {
      if (!silent) setLoading(false);
    }
  }, [t]);

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
        setNotice(payload.retryAfter ? t('nextRefresh', { seconds: payload.retryAfter }) : (payload.error ?? t('refreshFailed')));
        return;
      }
      await load(true);
      setNotice(t('refreshStored'));
    } catch {
      setNotice(t('refreshFailed'));
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
    { label: t('totalDeposits'), value: formatUsd(data.summary.totalDeposits), detail: t('acrossMarkets'), tone: 'positive' },
    { label: t('totalBorrows'), value: formatUsd(data.summary.totalBorrows), detail: t('capitalUtilization', { value: data.summary.utilization.toFixed(1) }), tone: 'positive' },
    { label: t('healthScore'), value: t('scoreOutOf100', { value: data.summary.healthScore }), detail: t('badDebtRatio', { value: data.summary.badDebtRatio.toFixed(3) }), tone: 'neutral' },
    { label: t('openRiskEvents'), value: String(data.summary.openEvents), detail: t('criticalSignals', { count: data.summary.criticalEvents }), tone: data.summary.criticalEvents ? 'danger' : 'positive' },
  ] : [], [data, t]);

  return (
    <AppShell
      eyebrow={t('dashboardEyebrow')}
      title={t('dashboardTitle')}
      description={t('dashboardDescription')}
      actions={
        <>
          <span className="sync-label">{t('autoRefresh')}</span>
          <button className="primary-button" disabled={refreshing} onClick={refresh}>
            <RefreshCw aria-hidden="true" className={refreshing ? 'spin' : ''} size={14} />
            {refreshing ? t('refreshing') : t('refresh')}
          </button>
        </>
      }
    >
      {notice ? <div className="notice" role="status">{notice}</div> : null}
      {error ? <div className="error-banner" role="alert"><AlertTriangle size={16} />{error}<button onClick={() => void load()}>{t('tryAgain')}</button></div> : null}
      {loading ? <DashboardSkeleton /> : data ? (
        <>
          <section className="metric-grid" aria-label={t('dashboardTitle')}>
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
                <div><p className="eyebrow">{t('capitalActivity')}</p><h2>{t('depositsAndBorrows')}</h2></div>
                <span className="panel-meta">{t('trend30')}</span>
              </div>
              <PortfolioTrendChart snapshots={data.snapshots} locale={locale} depositsLabel={t('chartDeposits')} borrowsLabel={t('chartBorrows')} />
            </article>
            <article className="panel revenue-panel" id="revenue">
              <div className="panel-heading">
                <div><p className="eyebrow">{t('revenueMix')}</p><h2>{t('protocolIncome')}</h2></div>
                <strong className="panel-total">{formatUsd(data.summary.revenue24h, 0)}</strong>
              </div>
              <RevenueMixChart
                revenueLabel={t('chartRevenue')}
                values={data.revenueMix.map((item) => ({ ...item, name: localizeRevenueName(item.name, language) }))}
              />
            </article>
          </section>

          <section className="dashboard-grid lower-grid">
            <article className="panel markets-panel">
              <div className="panel-heading">
                <div><p className="eyebrow">{t('exposure')}</p><h2>{t('marketRiskMonitor')}</h2></div>
                <Link className="text-button" href="/markets">{t('viewAllMarkets')}</Link>
              </div>
              <div className="table-wrap">
                <table>
                  <thead><tr><th>{t('market')}</th><th>{t('deposits')}</th><th>{t('borrows')}</th><th>{t('utilization')}</th><th>{t('change24h')}</th><th>{t('status')}</th></tr></thead>
                  <tbody>{data.markets.slice(0, 5).map((market) => (
                    <tr key={market.id}>
                      <td><span className="asset-icon">{market.symbol.slice(0, 1)}</span><div><strong>{market.symbol}</strong><small>{market.chain}</small></div></td>
                      <td>{formatUsd(market.totalDeposits)}</td><td>{formatUsd(market.totalBorrows)}</td><td>{market.utilization.toFixed(1)}%</td>
                      <td className={toneClass(market.change24h)}>{market.change24h >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}{Math.abs(market.change24h).toFixed(2)}%</td>
                      <td><span className={`risk-badge ${market.status}`}>{marketStatusLabel(market.status, language)}</span></td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            </article>

            <article className="panel events-panel">
              <div className="panel-heading">
                <div><p className="eyebrow">{t('latestSignals')}</p><h2>{t('riskEventStream')}</h2></div>
                <Link className="event-count" href="/events">{t('openCount', { count: data.summary.openEvents })}</Link>
              </div>
              <div className="event-list">{data.events.slice(0, 5).map((event) => {
                const localized = localizeEvent(event, language);
                return (
                  <div className="event-row event-row-action" key={event.id}>
                    <span className={`severity-dot ${event.severity}`} />
                    <div><strong>{localized.title}</strong><small>{localized.detail}</small></div>
                    {event.status === 'open' ? (
                      <button aria-label={t('acknowledgeEvent', { title: localized.title })} className="ack-button" onClick={() => void acknowledge(event)} title={t('acknowledge')}><Check size={13} /></button>
                    ) : <time>{formatTime(event.occurredAt, locale)}</time>}
                  </div>
                );
              })}</div>
            </article>
          </section>
          <p className="data-timestamp">{t('snapshotGenerated', { time: formatTime(data.generatedAt, locale) })} · {t('syntheticDisclaimer')}</p>
        </>
      ) : null}
    </AppShell>
  );
}
