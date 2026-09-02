'use client';

import { Clock3, RadioTower, RefreshCw, ShieldCheck, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import { AppShell } from '@/components/AppShell';
import { useI18n } from '@/components/I18n';
import type { PriceFeed } from '@/lib/types';
import { PriceDeviationChart } from './AdvancedCharts';
import { formatCompactUsd, MetricStrip, OperationsState, SegmentTabs, statusLabel, StatusBadge, useOperationsData } from './shared';

export default function PriceFeedsView() {
  const { language, locale } = useI18n();
  const { data, loading, error, reload } = useOperationsData();
  const [network, setNetwork] = useState('all');
  const [status, setStatus] = useState('all');
  const [selected, setSelected] = useState<PriceFeed | null>(null);
  const c = language === 'zh' ? {
    eyebrow: '数据监控 / 价格源', title: '价格源监测', description: '交叉核验主备价格源、偏差、心跳和端到端延迟，快速定位异常喂价。',
    refresh: '重新校验', all: '全部', healthy: '健康', attention: '需关注', feeds: '价格源', maxDeviation: '最大偏差', medianLatency: '中位延迟', fallback: '备用源接管', feedsStable: '个价格源稳定', threshold: '告警阈值 30 bps', seconds: '秒', incidents: '过去 24 小时 1 次',
    trend: '偏差趋势', trendTitle: '24 小时跨源价格偏差', deviation: '偏差 (bps)', registry: '价格源注册表', registryTitle: '主备数据源状态', asset: '资产 / 网络', primary: '主价格源', fallbackSource: '备用价格源', reference: '参考价', reported: '上报价', deviationCol: '偏差', latency: '延迟', confidence: '置信度', updated: '更新时间', state: '状态',
    details: '价格源详情', observed: '实时观测', heartbeat: '心跳周期', sourcePair: '数据源组合', validation: '校验结论', validationCopy: '聚合器同时比较主源、备用源和市场参考价；连续三个周期越界才升级告警。', close: '关闭详情', empty: '当前筛选下没有价格源。',
  } : {
    eyebrow: 'Data monitoring / Oracles', title: 'Price feed monitoring', description: 'Cross-check primary and fallback sources, deviation, heartbeat, and end-to-end latency to isolate oracle anomalies.',
    refresh: 'Revalidate', all: 'All', healthy: 'Healthy', attention: 'Attention', feeds: 'feeds', maxDeviation: 'Max deviation', medianLatency: 'Median latency', fallback: 'Fallback activations', feedsStable: 'feeds stable', threshold: 'Alert threshold 30 bps', seconds: 'sec', incidents: '1 incident in 24h',
    trend: 'Deviation trend', trendTitle: '24h cross-source price deviation', deviation: 'Deviation (bps)', registry: 'Feed registry', registryTitle: 'Primary and fallback source status', asset: 'Asset / Network', primary: 'Primary source', fallbackSource: 'Fallback source', reference: 'Reference', reported: 'Reported', deviationCol: 'Deviation', latency: 'Latency', confidence: 'Confidence', updated: 'Updated', state: 'Status',
    details: 'Feed details', observed: 'Live observation', heartbeat: 'Heartbeat', sourcePair: 'Source pair', validation: 'Validation logic', validationCopy: 'The aggregator compares primary, fallback, and market reference prices; an alert escalates after three consecutive breaches.', close: 'Close details', empty: 'No price feeds match the current filters.',
  };

  const feeds = useMemo(() => (data?.priceFeeds ?? []).filter((feed) => (
    (network === 'all' || feed.chain === network) &&
    (status === 'all' || (status === 'attention' ? feed.status !== 'healthy' : feed.status === status))
  )), [data, network, status]);
  const healthy = data?.priceFeeds.filter((feed) => feed.status === 'healthy').length ?? 0;
  const maxDeviation = Math.max(0, ...(data?.priceFeeds.map((feed) => feed.deviationBps) ?? []));
  const sortedLatency = [...(data?.priceFeeds ?? [])].map((feed) => feed.latencySeconds).sort((a, b) => a - b);
  const medianLatency = sortedLatency.length ? sortedLatency[Math.floor(sortedLatency.length / 2)] : 0;
  const networks = ['all', ...new Set((data?.priceFeeds ?? []).map((feed) => feed.chain))];

  return (
    <AppShell eyebrow={c.eyebrow} title={c.title} description={c.description} actions={
      <button className="ghost-button icon-button" onClick={() => void reload()}><RefreshCw size={14} />{c.refresh}</button>
    }>
      <OperationsState loading={loading} error={error} language={language} onRetry={() => void reload()} />
      {data ? <>
        <MetricStrip items={[
          { label: c.healthy, value: `${healthy}/${data.priceFeeds.length}`, detail: `${healthy} ${c.feedsStable}`, tone: 'positive' },
          { label: c.maxDeviation, value: `${maxDeviation.toFixed(1)} bps`, detail: c.threshold, tone: maxDeviation >= 30 ? 'danger' : '' },
          { label: c.medianLatency, value: `${medianLatency} ${c.seconds}`, detail: 'P95 46 sec' },
          { label: c.fallback, value: '1', detail: c.incidents },
        ]} />
        <section className="panel chart-panel-wide">
          <div className="panel-heading"><div><p className="eyebrow">{c.trend}</p><h2>{c.trendTitle}</h2></div><span className="panel-meta">30 bps SLA</span></div>
          <PriceDeviationChart history={data.priceHistory} locale={locale} labels={{ deviation: c.deviation }} />
        </section>
        <section className="panel data-panel ops-table-panel">
          <div className="ops-toolbar">
            <div><p className="eyebrow">{c.registry}</p><h2>{c.registryTitle}</h2></div>
            <div className="toolbar-controls">
              <SegmentTabs label="status" value={status} onChange={setStatus} items={[
                { value: 'all', label: c.all }, { value: 'healthy', label: c.healthy }, { value: 'attention', label: c.attention },
              ]} />
              <select aria-label="network" value={network} onChange={(event) => setNetwork(event.target.value)}>{networks.map((item) => <option key={item} value={item}>{item === 'all' ? c.all : item}</option>)}</select>
            </div>
          </div>
          <div className="table-wrap ops-table"><table>
            <thead><tr><th>{c.asset}</th><th>{c.primary}</th><th>{c.reference}</th><th>{c.reported}</th><th>{c.deviationCol}</th><th>{c.latency}</th><th>{c.confidence}</th><th>{c.updated}</th><th>{c.state}</th></tr></thead>
            <tbody>{feeds.length ? feeds.map((feed) => <tr className="clickable-row" key={feed.id} onClick={() => setSelected(feed)}>
              <td><span className="asset-icon">{feed.symbol[0]}</span><div><strong>{feed.symbol}</strong><small>{feed.chain}</small></div></td>
              <td><strong>{feed.primarySource}</strong><small className="cell-subtext">{feed.fallbackSource}</small></td>
              <td>{feed.referencePrice < 10 ? `$${feed.referencePrice.toFixed(4)}` : formatCompactUsd(feed.referencePrice, language)}</td>
              <td>{feed.reportedPrice < 10 ? `$${feed.reportedPrice.toFixed(4)}` : formatCompactUsd(feed.reportedPrice, language)}</td>
              <td className={feed.deviationBps >= 30 ? 'danger' : feed.deviationBps >= 15 ? 'amber' : ''}>{feed.deviationBps.toFixed(1)} bps</td>
              <td>{feed.latencySeconds}s</td><td>{feed.confidence.toFixed(1)}%</td>
              <td>{new Date(feed.updatedAt).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}</td>
              <td><StatusBadge status={feed.status} label={statusLabel(feed.status, language)} /></td>
            </tr>) : <tr><td className="table-empty" colSpan={9}>{c.empty}</td></tr>}</tbody>
          </table></div>
        </section>
        {selected ? <aside className="detail-drawer" aria-label={c.details}>
          <div className="drawer-head"><div><p className="eyebrow">{c.details}</p><h2>{selected.symbol} · {selected.chain}</h2></div><button aria-label={c.close} onClick={() => setSelected(null)}><X size={17} /></button></div>
          <div className="drawer-observation"><RadioTower size={20} /><div><span>{c.observed}</span><strong>{selected.reportedPrice < 10 ? `$${selected.reportedPrice.toFixed(5)}` : formatCompactUsd(selected.reportedPrice, language)}</strong></div><StatusBadge status={selected.status} label={statusLabel(selected.status, language)} /></div>
          <dl className="drawer-facts"><div><dt>{c.deviationCol}</dt><dd>{selected.deviationBps.toFixed(1)} bps</dd></div><div><dt>{c.confidence}</dt><dd>{selected.confidence.toFixed(2)}%</dd></div><div><dt>{c.heartbeat}</dt><dd><Clock3 size={13} />{selected.heartbeatSeconds}s</dd></div><div><dt>{c.sourcePair}</dt><dd>{selected.primarySource} / {selected.fallbackSource}</dd></div></dl>
          <div className="drawer-note"><ShieldCheck size={17} /><div><strong>{c.validation}</strong><p>{c.validationCopy}</p></div></div>
        </aside> : null}
      </> : null}
    </AppShell>
  );
}
