'use client';

import { Search, ShieldCheck } from 'lucide-react';
import { useMemo, useState } from 'react';
import { AppShell } from '@/components/AppShell';
import { useI18n } from '@/components/I18n';
import { LiquidationChart } from './AdvancedCharts';
import { formatCompactUsd, MetricStrip, OperationsState, SegmentTabs, statusLabel, StatusBadge, useOperationsData } from './shared';

export default function LiquidationsView() {
  const { language, locale } = useI18n();
  const { data, loading, error, reload } = useOperationsData();
  const [network, setNetwork] = useState('all');
  const [mode, setMode] = useState<'repaid' | 'reward'>('repaid');
  const [asset, setAsset] = useState('all');
  const [search, setSearch] = useState('');
  const c = language === 'zh' ? {
    eyebrow: '事件总览 / 清算', title: '清算事件分析', description: '按网络、协议版本和资产观察清算偿还额、清算奖励、事件数量与执行路径。', repaid: '清算偿还额', reward: '清算奖励', events: '清算事件', avg: '平均单笔', settled: '已完成结算', current: '当前筛选范围', success: '结算成功率 98.7%', average: '过去 30 天平均',
    trend: '清算趋势', trendTitle: '30 天清算活动', all: '全部', ledger: '清算流水', ledgerTitle: '最近清算事件', search: '搜索借款人或市场', allAssets: '全部资产', id: '事件', market: '市场 / 版本', borrower: '借款人', debt: '债务资产', collateral: '抵押资产', repaidCol: '偿还金额', rewardCol: '清算奖励', route: '执行路径', time: '时间', status: '状态', noData: '没有符合筛选条件的清算记录。',
    direct: '直接清算', auction: '拍卖', backstop: '风险兜底',
  } : {
    eyebrow: 'Event overview / Liquidations', title: 'Liquidation analytics', description: 'Analyze repaid value, liquidator rewards, event volume, and execution routes by network, protocol version, and asset.', repaid: 'Liquidation repaid', reward: 'Liquidator rewards', events: 'Liquidation events', avg: 'Average ticket', settled: 'Settled', current: 'Current filter scope', success: '98.7% settlement success', average: '30-day average',
    trend: 'Liquidation trend', trendTitle: '30-day liquidation activity', all: 'All', ledger: 'Liquidation ledger', ledgerTitle: 'Recent liquidation events', search: 'Search borrower or market', allAssets: 'All assets', id: 'Event', market: 'Market / Version', borrower: 'Borrower', debt: 'Debt asset', collateral: 'Collateral', repaidCol: 'Repaid', rewardCol: 'Reward', route: 'Route', time: 'Time', status: 'Status', noData: 'No liquidations match the current filters.',
    direct: 'Direct', auction: 'Auction', backstop: 'Backstop',
  };
  const records = useMemo(() => (data?.liquidations ?? []).filter((item) => {
    const q = search.trim().toLowerCase();
    return (network === 'all' || item.network === network) && (asset === 'all' || item.debtAsset === asset || item.collateralAsset === asset) && (!q || `${item.borrower} ${item.market} ${item.id}`.toLowerCase().includes(q));
  }), [asset, data, network, search]);
  const totals = records.reduce((result, item) => ({ repaid: result.repaid + item.repaidUsd, reward: result.reward + item.rewardUsd }), { repaid: 0, reward: 0 });
  const routeLabel: Record<string, string> = { direct: c.direct, auction: c.auction, backstop: c.backstop };
  const assets = ['all', ...new Set((data?.liquidations ?? []).flatMap((item) => [item.debtAsset, item.collateralAsset]))];
  return (
    <AppShell eyebrow={c.eyebrow} title={c.title} description={c.description}>
      <OperationsState loading={loading} error={error} language={language} onRetry={() => void reload()} />
      {data ? <>
        <div className="view-control-bar"><SegmentTabs label="network" value={network} onChange={setNetwork} items={[{ value: 'all', label: c.all }, { value: 'Ethereum', label: 'Ethereum' }, { value: 'TRON', label: 'TRON' }, { value: 'Bitcoin', label: 'Bitcoin' }]} /><SegmentTabs label="metric" value={mode} onChange={(value) => setMode(value as 'repaid' | 'reward')} items={[{ value: 'repaid', label: c.repaid }, { value: 'reward', label: c.reward }]} /></div>
        <MetricStrip items={[
          { label: c.repaid, value: formatCompactUsd(totals.repaid, language), detail: c.current },
          { label: c.reward, value: formatCompactUsd(totals.reward, language), detail: '4.9% effective rate', tone: 'positive' },
          { label: c.events, value: records.length, detail: c.success },
          { label: c.avg, value: formatCompactUsd(records.length ? totals.repaid / records.length : 0, language), detail: c.average },
        ]} />
        <section className="panel chart-panel-wide"><div className="panel-heading"><div><p className="eyebrow">{c.trend}</p><h2>{c.trendTitle}</h2></div><span className="panel-meta">{network === 'all' ? c.all : network}</span></div><LiquidationChart history={data.liquidationHistory} locale={locale} labels={{ repaid: c.repaid, reward: c.reward, events: c.events }} mode={mode} /></section>
        <section className="panel data-panel ops-table-panel">
          <div className="ops-toolbar"><div><p className="eyebrow">{c.ledger}</p><h2>{c.ledgerTitle}</h2></div><div className="toolbar-controls"><label className="search-field compact-search"><Search size={14} /><input aria-label={c.search} placeholder={c.search} value={search} onChange={(event) => setSearch(event.target.value)} /></label><select aria-label={c.allAssets} value={asset} onChange={(event) => setAsset(event.target.value)}>{assets.map((item) => <option key={item} value={item}>{item === 'all' ? c.allAssets : item}</option>)}</select></div></div>
          <div className="table-wrap ops-table liquidation-table"><table><thead><tr><th>{c.id}</th><th>{c.market}</th><th>{c.borrower}</th><th>{c.debt}</th><th>{c.collateral}</th><th>{c.repaidCol}</th><th>{c.rewardCol}</th><th>{c.route}</th><th>{c.time}</th><th>{c.status}</th></tr></thead><tbody>{records.length ? records.map((item) => <tr key={item.id}>
            <td><span className="record-id">{item.id}</span></td><td><span className="asset-icon">{item.market[0]}</span><div><strong>{item.market}</strong><small>{item.network} · {item.version}</small></div></td><td><code>{item.borrower}</code></td><td><span className="token-pill debt-token">{item.debtAsset}</span></td><td><span className="token-pill">{item.collateralAsset}</span></td><td><strong>{formatCompactUsd(item.repaidUsd, language)}</strong></td><td className="positive">{formatCompactUsd(item.rewardUsd, language)}</td><td>{routeLabel[item.route]}</td><td>{new Date(item.occurredAt).toLocaleString(locale, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false })}</td><td><StatusBadge status={item.status} label={statusLabel(item.status, language)} /></td>
          </tr>) : <tr><td className="table-empty" colSpan={10}>{c.noData}</td></tr>}</tbody></table></div>
        </section>
        <div className="ops-assurance"><ShieldCheck size={15} /><span>{language === 'zh' ? '清算记录为合成数据；筛选状态在页面内独立维护，不会污染其他网络视图。' : 'Liquidation records are synthetic; filter state is isolated so one network view does not affect another.'}</span></div>
      </> : null}
    </AppShell>
  );
}
