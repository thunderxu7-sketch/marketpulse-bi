'use client';

import { Download, Search } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Market } from '@/lib/types';
import { AppShell } from './AppShell';
import { formatUsd } from './Format';

export default function MarketsView() {
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
    const header = ['symbol', 'chain', 'price', 'deposits', 'borrows', 'utilization', 'riskScore', 'status'];
    const rows = markets.map((market) => [market.symbol, market.chain, market.price, market.totalDeposits, market.totalBorrows, market.utilization, market.riskScore, market.status]);
    const blob = new Blob([[header, ...rows].map((row) => row.join(',')).join('\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url; anchor.download = 'marketpulse-markets.csv'; anchor.click(); URL.revokeObjectURL(url);
  };

  return (
    <AppShell eyebrow="Exposure analysis" title="Markets" description="Filter, compare, and export the current risk posture for every monitored market."
      actions={<button className="ghost-button icon-button" onClick={exportCsv}><Download size={14} />Export CSV</button>}>
      <section className="compact-metrics">
        <div><span>Filtered deposits</span><strong>{formatUsd(totals.deposits)}</strong></div>
        <div><span>Filtered borrows</span><strong>{formatUsd(totals.borrows)}</strong></div>
        <div><span>Markets requiring attention</span><strong>{totals.atRisk}</strong></div>
      </section>
      <section className="panel data-panel">
        <div className="filter-row">
          <label className="search-field"><Search size={14} /><input aria-label="Search markets" placeholder="Search asset or chain" value={search} onChange={(event) => setSearch(event.target.value)} /></label>
          <label><span>Status</span><select value={status} onChange={(event) => setStatus(event.target.value)}><option value="all">All statuses</option><option value="healthy">Healthy</option><option value="watch">Watch</option><option value="critical">Critical</option></select></label>
          <label><span>Sort by</span><select value={sort} onChange={(event) => setSort(event.target.value)}><option value="risk">Risk score</option><option value="utilization">Utilization</option><option value="deposits">Deposits</option></select></label>
        </div>
        <div className="table-wrap markets-full-table">
          <table>
            <thead><tr><th>Market</th><th>Price</th><th>24h change</th><th>Deposits</th><th>Borrows</th><th>Utilization</th><th>Bad debt</th><th>Risk score</th><th>Status</th></tr></thead>
            <tbody>{loading ? <tr><td colSpan={9} className="table-empty">Loading market data…</td></tr> : markets.length ? markets.map((market) => (
              <tr key={market.id}>
                <td><span className="asset-icon">{market.symbol[0]}</span><div><strong>{market.symbol}</strong><small>{market.name} · {market.chain}</small></div></td>
                <td>{market.price < 10 ? `$${market.price.toFixed(4)}` : formatUsd(market.price)}</td>
                <td className={market.change24h >= 0 ? 'positive' : 'danger'}>{market.change24h >= 0 ? '+' : ''}{market.change24h.toFixed(2)}%</td>
                <td>{formatUsd(market.totalDeposits)}</td><td>{formatUsd(market.totalBorrows)}</td><td>{market.utilization.toFixed(1)}%</td><td>{formatUsd(market.badDebt)}</td>
                <td><div className="risk-score"><span style={{ width: `${market.riskScore}%` }} /><b>{market.riskScore}</b></div></td>
                <td><span className={`risk-badge ${market.status}`}>{market.status}</span></td>
              </tr>
            )) : <tr><td colSpan={9} className="table-empty">No markets match these filters.</td></tr>}</tbody>
          </table>
        </div>
      </section>
    </AppShell>
  );
}
