'use client';

import { Download, Search } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Market } from '@/lib/types';
import { AppShell } from './AppShell';
import { formatUsd } from './Format';
import { useI18n } from './I18n';
import { marketStatusLabel } from './Localize';

export default function MarketsView() {
  const { language, t } = useI18n();
  const [markets, setMarkets] = useState<Market[]>([]);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [sort, setSort] = useState('risk');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ search, status, sort });
    const response = await fetch(`/api/markets?${params}`, { cache: 'no-store' });
    const payload = await response.json() as { markets: Market[] };
    setMarkets(payload.markets ?? []);
    setLoading(false);
  }, [search, sort, status]);

  useEffect(() => { const timer = window.setTimeout(() => void load(), 180); return () => window.clearTimeout(timer); }, [load]);

  const totals = useMemo(() => ({
    deposits: markets.reduce((value, market) => value + market.totalDeposits, 0),
    borrows: markets.reduce((value, market) => value + market.totalBorrows, 0),
    atRisk: markets.filter((market) => market.status !== 'healthy').length,
  }), [markets]);

  const exportCsv = () => {
    const header = [t('market'), 'chain', t('price'), t('deposits'), t('borrows'), t('utilization'), t('riskScore'), t('status')];
    const rows = markets.map((market) => [market.symbol, market.chain, market.price, market.totalDeposits, market.totalBorrows, market.utilization, market.riskScore, marketStatusLabel(market.status, language)]);
    const escapeCell = (value: string | number) => `"${String(value).replaceAll('"', '""')}"`;
    const blob = new Blob([`\uFEFF${[header, ...rows].map((row) => row.map(escapeCell).join(',')).join('\n')}`], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url; anchor.download = 'marketpulse-markets.csv'; anchor.click(); URL.revokeObjectURL(url);
  };

  return (
    <AppShell eyebrow={t('marketsEyebrow')} title={t('marketsTitle')} description={t('marketsDescription')}
      actions={<button className="ghost-button icon-button" onClick={exportCsv}><Download size={14} />{t('exportCsv')}</button>}>
      <section className="compact-metrics">
        <div><span>{t('filteredDeposits')}</span><strong>{formatUsd(totals.deposits)}</strong></div>
        <div><span>{t('filteredBorrows')}</span><strong>{formatUsd(totals.borrows)}</strong></div>
        <div><span>{t('marketsAttention')}</span><strong>{totals.atRisk}</strong></div>
      </section>
      <section className="panel data-panel">
        <div className="filter-row">
          <label className="search-field"><Search size={14} /><input aria-label={t('searchMarkets')} placeholder={t('searchPlaceholder')} value={search} onChange={(event) => setSearch(event.target.value)} /></label>
          <label><span>{t('status')}</span><select value={status} onChange={(event) => setStatus(event.target.value)}><option value="all">{t('allStatuses')}</option><option value="healthy">{t('statusHealthy')}</option><option value="watch">{t('statusWatch')}</option><option value="critical">{t('statusCritical')}</option></select></label>
          <label><span>{t('sortBy')}</span><select value={sort} onChange={(event) => setSort(event.target.value)}><option value="risk">{t('riskScore')}</option><option value="utilization">{t('utilization')}</option><option value="deposits">{t('deposits')}</option></select></label>
        </div>
        <div className="table-wrap markets-full-table">
          <table>
            <thead><tr><th>{t('market')}</th><th>{t('price')}</th><th>{t('change24h')}</th><th>{t('deposits')}</th><th>{t('borrows')}</th><th>{t('utilization')}</th><th>{t('badDebt')}</th><th>{t('riskScore')}</th><th>{t('status')}</th></tr></thead>
            <tbody>{loading ? <tr><td colSpan={9} className="table-empty">{t('loadingMarkets')}</td></tr> : markets.length ? markets.map((market) => (
              <tr key={market.id}>
                <td><span className="asset-icon">{market.symbol[0]}</span><div><strong>{market.symbol}</strong><small>{market.name} · {market.chain}</small></div></td>
                <td>{market.price < 10 ? `$${market.price.toFixed(4)}` : formatUsd(market.price)}</td>
                <td className={market.change24h >= 0 ? 'positive' : 'danger'}>{market.change24h >= 0 ? '+' : ''}{market.change24h.toFixed(2)}%</td>
                <td>{formatUsd(market.totalDeposits)}</td><td>{formatUsd(market.totalBorrows)}</td><td>{market.utilization.toFixed(1)}%</td><td>{formatUsd(market.badDebt)}</td>
                <td><div className="risk-score"><span style={{ width: `${market.riskScore}%` }} /><b>{market.riskScore}</b></div></td>
                <td><span className={`risk-badge ${market.status}`}>{marketStatusLabel(market.status, language)}</span></td>
              </tr>
            )) : <tr><td colSpan={9} className="table-empty">{t('noMarkets')}</td></tr>}</tbody>
          </table>
        </div>
      </section>
    </AppShell>
  );
}
