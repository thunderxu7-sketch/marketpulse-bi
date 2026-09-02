'use client';

import { Download, TrendingDown, TrendingUp } from 'lucide-react';
import { useMemo, useState } from 'react';
import { AppShell } from '@/components/AppShell';
import { useI18n } from '@/components/I18n';
import { RevenueChart } from './AdvancedCharts';
import { downloadCsv, formatCompactUsd, MetricStrip, OperationsState, SegmentTabs, useOperationsData } from './shared';

export default function RevenueView() {
  const { language, locale } = useI18n();
  const { data, loading, error, reload } = useOperationsData();
  const [range, setRange] = useState('30');
  const [currency, setCurrency] = useState<'USD' | 'TRX'>('USD');
  const [network, setNetwork] = useState('all');
  const c = language === 'zh' ? {
    eyebrow: '资金监控 / 收入', title: '收入分析看板', description: '从当前、累计、来源、利润率与趋势五个维度拆解协议收入，支持币种与网络视图切换。', export: '导出收入',
    current: '本周期收入', cumulative: '累计收入', margin: '综合利润率', growth: '环比增长', period7: '过去 7 天', period30: '过去 30 天', sinceLaunch: '自系统上线', afterCosts: '扣除执行与基础设施成本', prior: '较上一周期', composition: '收入构成', trendTitle: '按来源拆分收入趋势', day7: '7 天', day30: '30 天', lending: '借贷利息', liquidation: '清算费用', automation: '自动化服务', treasury: '资金库收益',
    products: '产品表现', productsTitle: '收入来源明细', all: '全部网络', source: '收入来源', network: '网络', seven: '7 天收入', thirty: '30 天收入', total: '累计收入', share: '占比', marginCol: '利润率', change: '环比', disclaimer: '当前与累计口径独立，网络筛选不会改写历史累计数据。',
  } : {
    eyebrow: 'Fund monitoring / Revenue', title: 'Revenue analytics', description: 'Break down protocol income across current, cumulative, source, margin, and trend dimensions with currency and network controls.', export: 'Export revenue',
    current: 'Current-period revenue', cumulative: 'Cumulative revenue', margin: 'Blended margin', growth: 'Period growth', period7: 'Past 7 days', period30: 'Past 30 days', sinceLaunch: 'Since platform launch', afterCosts: 'After execution and infrastructure costs', prior: 'Versus prior period', composition: 'Revenue composition', trendTitle: 'Revenue trend by source', day7: '7 days', day30: '30 days', lending: 'Lending interest', liquidation: 'Liquidation fees', automation: 'Automation services', treasury: 'Treasury yield',
    products: 'Product performance', productsTitle: 'Revenue source details', all: 'All networks', source: 'Revenue source', network: 'Network', seven: '7d revenue', thirty: '30d revenue', total: 'Cumulative', share: 'Share', marginCol: 'Margin', change: 'Change', disclaimer: 'Current and cumulative figures use independent definitions; network filters do not rewrite historical totals.',
  };
  const history = (data?.revenueHistory ?? []).slice(range === '7' ? -7 : -30);
  const productRows = useMemo(() => (data?.revenueProducts ?? []).filter((item) => network === 'all' || item.network === network || item.network === 'Multi-chain'), [data, network]);
  const periodUsd = productRows.reduce((sum, item) => sum + (range === '7' ? item.revenue7d : item.revenue30d), 0);
  const cumulativeUsd = productRows.reduce((sum, item) => sum + item.cumulativeRevenue, 0);
  const margin = productRows.length ? productRows.reduce((sum, item) => sum + item.margin * item.share, 0) / productRows.reduce((sum, item) => sum + item.share, 0) : 0;
  const multiplier = currency === 'TRX' ? 1 / 0.34 : 1;
  const amount = (value: number) => currency === 'USD' ? formatCompactUsd(value, language) : `${(value * multiplier).toLocaleString(locale, { notation: 'compact', maximumFractionDigits: 1 })} TRX`;
  const exportRows = () => downloadCsv('marketpulse-revenue.csv', [[c.source, c.network, c.seven, c.thirty, c.total, c.marginCol, c.share, c.change], ...productRows.map((item) => [item.name, item.network, item.revenue7d, item.revenue30d, item.cumulativeRevenue, item.margin, item.share, item.change])]);

  return (
    <AppShell eyebrow={c.eyebrow} title={c.title} description={c.description} actions={<button className="ghost-button icon-button" onClick={exportRows}><Download size={14} />{c.export}</button>}>
      <OperationsState loading={loading} error={error} language={language} onRetry={() => void reload()} />
      {data ? <>
        <div className="view-control-bar"><SegmentTabs label="currency" value={currency} onChange={(value) => setCurrency(value as 'USD' | 'TRX')} items={[{ value: 'USD', label: 'USD' }, { value: 'TRX', label: 'TRX' }]} /><span>{language === 'zh' ? '参考汇率：1 TRX = $0.34' : 'Reference rate: 1 TRX = $0.34'}</span></div>
        <MetricStrip items={[
          { label: c.current, value: amount(periodUsd), detail: range === '7' ? c.period7 : c.period30, tone: 'positive' },
          { label: c.cumulative, value: amount(cumulativeUsd), detail: c.sinceLaunch },
          { label: c.margin, value: `${margin.toFixed(1)}%`, detail: c.afterCosts },
          { label: c.growth, value: '+7.8%', detail: c.prior, tone: 'positive' },
        ]} />
        <section className="panel chart-panel-wide"><div className="panel-heading"><div><p className="eyebrow">{c.composition}</p><h2>{c.trendTitle}</h2></div><SegmentTabs label="range" value={range} onChange={setRange} items={[{ value: '7', label: c.day7 }, { value: '30', label: c.day30 }]} /></div><RevenueChart history={history} locale={locale} labels={{ lending: c.lending, liquidation: c.liquidation, automation: c.automation, treasury: c.treasury }} multiplier={multiplier} /></section>
        <section className="panel data-panel ops-table-panel">
          <div className="ops-toolbar"><div><p className="eyebrow">{c.products}</p><h2>{c.productsTitle}</h2></div><select aria-label={c.network} value={network} onChange={(event) => setNetwork(event.target.value)}><option value="all">{c.all}</option><option>TRON</option><option>Ethereum</option><option>Multi-chain</option></select></div>
          <div className="table-wrap ops-table revenue-table"><table><thead><tr><th>{c.source}</th><th>{c.network}</th><th>{c.seven}</th><th>{c.thirty}</th><th>{c.total}</th><th>{c.share}</th><th>{c.marginCol}</th><th>{c.change}</th></tr></thead><tbody>{productRows.map((item) => <tr key={item.id}>
            <td><span className="revenue-source-icon">{item.name[0]}</span><div><strong>{language === 'zh' ? ({ 'Lending V3': '借贷 V3', 'Lending V2': '借贷 V2', 'Automation services': '自动化服务', 'Liquidation fees': '清算费用', 'Treasury yield': '资金库收益' } as Record<string, string>)[item.name] : item.name}</strong><small>{item.id}</small></div></td><td>{item.network === 'Multi-chain' && language === 'zh' ? '多链' : item.network}</td><td>{amount(item.revenue7d)}</td><td><strong>{amount(item.revenue30d)}</strong></td><td>{amount(item.cumulativeRevenue)}</td><td><div className="share-cell"><em><i style={{ width: `${item.share}%` }} /></em><span>{item.share.toFixed(1)}%</span></div></td><td>{item.margin.toFixed(1)}%</td><td className={item.change >= 0 ? 'positive' : 'danger'}>{item.change >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}{Math.abs(item.change).toFixed(1)}%</td>
          </tr>)}</tbody></table></div>
          <p className="panel-footnote">{c.disclaimer}</p>
        </section>
      </> : null}
    </AppShell>
  );
}
