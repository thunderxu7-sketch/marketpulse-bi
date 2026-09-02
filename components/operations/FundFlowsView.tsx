'use client';

import { ArrowDownLeft, ArrowUpRight, Download, Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import { AppShell } from '@/components/AppShell';
import { useI18n } from '@/components/I18n';
import { FundFlowChart } from './AdvancedCharts';
import { downloadCsv, formatCompactUsd, MetricStrip, OperationsState, SegmentTabs, statusLabel, StatusBadge, useOperationsData } from './shared';

export default function FundFlowsView() {
  const { language, locale } = useI18n();
  const { data, loading, error, reload } = useOperationsData();
  const [range, setRange] = useState('30');
  const [network, setNetwork] = useState('all');
  const [direction, setDirection] = useState('all');
  const [search, setSearch] = useState('');
  const c = language === 'zh' ? {
    eyebrow: '资金监控 / 流动', title: '资金流动监控', description: '统一观察存取款、借还款净流向，筛选大额交易并识别异常账户活动。', export: '导出流水',
    net: '净资金流入', inflow: '总流入', outflow: '总流出', large: '大额交易', versus: '较上一周期 +8.4%', depRepay: '存款 + 还款', withBorrow: '提现 + 借款', review: '笔待复核', trend: '资金趋势', trendTitle: '存取借还资金流', day7: '7 天', day30: '30 天', deposits: '存款', withdrawals: '提现', borrows: '借款', repayments: '还款',
    ledger: '资金流水', ledgerTitle: '最近大额账户活动', all: '全部', incoming: '流入', outgoing: '流出', search: '搜索资产或账户', tx: '交易', type: '类型', asset: '资产 / 网络', account: '账户', amount: '数量', value: '折合金额', risk: '风险', time: '时间', noData: '没有符合筛选条件的流水。',
  } : {
    eyebrow: 'Fund monitoring / Flows', title: 'Fund-flow monitoring', description: 'Observe net deposits, withdrawals, borrows, and repayments; filter large transfers and isolate unusual account activity.', export: 'Export ledger',
    net: 'Net capital flow', inflow: 'Gross inflow', outflow: 'Gross outflow', large: 'Large transfers', versus: '+8.4% vs prior period', depRepay: 'Deposits + repayments', withBorrow: 'Withdrawals + borrows', review: 'transactions need review', trend: 'Flow trend', trendTitle: 'Deposit, withdrawal, borrow, and repay flows', day7: '7 days', day30: '30 days', deposits: 'Deposits', withdrawals: 'Withdrawals', borrows: 'Borrows', repayments: 'Repayments',
    ledger: 'Fund ledger', ledgerTitle: 'Recent large account activity', all: 'All', incoming: 'Inflows', outgoing: 'Outflows', search: 'Search asset or account', tx: 'Transaction', type: 'Type', asset: 'Asset / Network', account: 'Account', amount: 'Amount', value: 'USD value', risk: 'Risk', time: 'Time', noData: 'No transfers match the current filters.',
  };
  const history = (data?.flowHistory ?? []).slice(range === '7' ? -7 : -30);
  const totalIn = history.reduce((sum, item) => sum + item.deposits + item.repayments, 0);
  const totalOut = history.reduce((sum, item) => sum + item.withdrawals + item.borrows, 0);
  const transfers = useMemo(() => (data?.transfers ?? []).filter((item) => {
    const query = search.trim().toLowerCase();
    return (network === 'all' || item.network === network) && (direction === 'all' || item.direction === direction) && (!query || `${item.asset} ${item.account} ${item.id}`.toLowerCase().includes(query));
  }), [data, direction, network, search]);
  const actionName = (value: string) => ({
    deposit: language === 'zh' ? '存款' : 'Deposit', withdrawal: language === 'zh' ? '提现' : 'Withdrawal', borrow: language === 'zh' ? '借款' : 'Borrow', repayment: language === 'zh' ? '还款' : 'Repayment',
  } as Record<string, string>)[value] ?? value;
  const exportRows = () => downloadCsv('marketpulse-fund-flows.csv', [[c.tx, c.type, c.asset, c.account, c.amount, c.value, c.risk, c.time], ...transfers.map((item) => [item.id, actionName(item.action), `${item.asset} · ${item.network}`, item.account, item.amount, item.valueUsd, statusLabel(item.riskLevel, language), item.occurredAt])]);

  return (
    <AppShell eyebrow={c.eyebrow} title={c.title} description={c.description} actions={<button className="ghost-button icon-button" onClick={exportRows}><Download size={14} />{c.export}</button>}>
      <OperationsState loading={loading} error={error} language={language} onRetry={() => void reload()} />
      {data ? <>
        <MetricStrip items={[
          { label: c.net, value: formatCompactUsd(totalIn - totalOut, language), detail: c.versus, tone: 'positive' },
          { label: c.inflow, value: formatCompactUsd(totalIn, language), detail: c.depRepay },
          { label: c.outflow, value: formatCompactUsd(totalOut, language), detail: c.withBorrow },
          { label: c.large, value: data.transfers.filter((item) => item.valueUsd >= 2_000_000).length, detail: `${data.transfers.filter((item) => item.riskLevel !== 'normal').length} ${c.review}`, tone: 'amber' },
        ]} />
        <section className="panel chart-panel-wide"><div className="panel-heading"><div><p className="eyebrow">{c.trend}</p><h2>{c.trendTitle}</h2></div><SegmentTabs label="range" value={range} onChange={setRange} items={[{ value: '7', label: c.day7 }, { value: '30', label: c.day30 }]} /></div><FundFlowChart history={history} locale={locale} labels={{ deposits: c.deposits, withdrawals: c.withdrawals, borrows: c.borrows, repayments: c.repayments }} /></section>
        <section className="panel data-panel ops-table-panel">
          <div className="ops-toolbar"><div><p className="eyebrow">{c.ledger}</p><h2>{c.ledgerTitle}</h2></div><div className="toolbar-controls">
            <label className="search-field compact-search"><Search size={14} /><input aria-label={c.search} placeholder={c.search} value={search} onChange={(event) => setSearch(event.target.value)} /></label>
            <SegmentTabs label="direction" value={direction} onChange={setDirection} items={[{ value: 'all', label: c.all }, { value: 'inflow', label: c.incoming }, { value: 'outflow', label: c.outgoing }]} />
            <select aria-label="network" value={network} onChange={(event) => setNetwork(event.target.value)}><option value="all">{c.all}</option><option>TRON</option><option>Ethereum</option><option>Bitcoin</option></select>
          </div></div>
          <div className="table-wrap ops-table"><table><thead><tr><th>{c.tx}</th><th>{c.type}</th><th>{c.asset}</th><th>{c.account}</th><th>{c.amount}</th><th>{c.value}</th><th>{c.risk}</th><th>{c.time}</th></tr></thead><tbody>{transfers.length ? transfers.map((item) => <tr key={item.id}>
            <td><span className="record-id">{item.id}</span></td><td><span className={`flow-direction ${item.direction}`}>{item.direction === 'inflow' ? <ArrowDownLeft size={13} /> : <ArrowUpRight size={13} />}{actionName(item.action)}</span></td><td><span className="asset-symbol">{item.asset}</span><small className="cell-subtext">{item.network}</small></td><td><code>{item.account}</code></td><td>{item.amount.toLocaleString(locale, { maximumFractionDigits: item.amount > 10_000 ? 0 : 3 })}</td><td><strong>{formatCompactUsd(item.valueUsd, language)}</strong></td><td><StatusBadge status={item.riskLevel} label={statusLabel(item.riskLevel, language)} /></td><td>{new Date(item.occurredAt).toLocaleString(locale, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false })}</td>
          </tr>) : <tr><td className="table-empty" colSpan={8}>{c.noData}</td></tr>}</tbody></table></div>
        </section>
      </> : null}
    </AppShell>
  );
}
