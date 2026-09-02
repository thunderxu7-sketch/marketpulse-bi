'use client';

import { CircleDollarSign, ShieldAlert, WalletCards } from 'lucide-react';
import { useMemo, useState } from 'react';
import { AppShell } from '@/components/AppShell';
import { useI18n } from '@/components/I18n';
import { DebtCoverageChart } from './AdvancedCharts';
import { formatCompactUsd, MetricStrip, OperationsState, SegmentTabs, statusLabel, StatusBadge, useOperationsData } from './shared';

export default function BadDebtView() {
  const { language } = useI18n();
  const { data, loading, error, reload } = useOperationsData();
  const [segment, setSegment] = useState('all');
  const [cause, setCause] = useState('all');
  const c = language === 'zh' ? {
    eyebrow: '数据监控 / 风险资产', title: '坏账监测', description: '按网络和协议版本追踪坏账存量、拨备覆盖、可追偿金额与根因处置进度。',
    current: '当前坏账', coverage: '拨备覆盖率', recoverable: '预计可追偿', accounts: '受影响账户', ofBorrow: '占总借款 0.14%', coverageTarget: '目标 75%', recoveryRate: '综合回收率 72.4%', activeCases: '个活跃案例', exposure: '敞口结构', coverageTitle: '各版本坏账与覆盖能力', badDebt: '坏账', provisioned: '已拨备', recoverableShort: '可追偿',
    causes: '根因分布', rootCause: '活跃案例根因', cases: '处置队列', caseTitle: '坏账案例明细', all: '全部', oracle: '价格源空窗', liquidity: '流动性不足', volatility: '极端波动', execution: '执行失败',
    id: '案例', market: '市场 / 版本', network: '网络', amount: '坏账金额', cause: '根因', health: '健康因子', age: '存续时间', rec: '可追偿', state: '进度', hours: '小时', empty: '没有符合条件的案例。',
  } : {
    eyebrow: 'Data monitoring / Risk assets', title: 'Bad-debt monitoring', description: 'Track bad-debt stock, provision coverage, recoverable value, and root-cause remediation by network and protocol version.',
    current: 'Current bad debt', coverage: 'Provision coverage', recoverable: 'Expected recovery', accounts: 'Affected accounts', ofBorrow: '0.14% of total borrows', coverageTarget: 'Target 75%', recoveryRate: '72.4% blended recovery', activeCases: 'active cases', exposure: 'Exposure structure', coverageTitle: 'Bad debt and coverage by version', badDebt: 'Bad debt', provisioned: 'Provisioned', recoverableShort: 'Recoverable',
    causes: 'Root-cause mix', rootCause: 'Active case attribution', cases: 'Remediation queue', caseTitle: 'Bad-debt case details', all: 'All', oracle: 'Oracle gap', liquidity: 'Liquidity', volatility: 'Volatility', execution: 'Execution',
    id: 'Case', market: 'Market / Version', network: 'Network', amount: 'Bad debt', cause: 'Root cause', health: 'Health factor', age: 'Age', rec: 'Recoverable', state: 'Progress', hours: 'hours', empty: 'No cases match the current filters.',
  };
  const cases = useMemo(() => (data?.badDebtCases ?? []).filter((item) => (
    (segment === 'all' || item.version === segment || item.network === segment) &&
    (cause === 'all' || item.cause === cause)
  )), [cause, data, segment]);
  const totalDebt = data?.debtSegments.reduce((sum, item) => sum + item.badDebt, 0) ?? 0;
  const provisioned = data?.debtSegments.reduce((sum, item) => sum + item.provisioned, 0) ?? 0;
  const recoverable = data?.debtSegments.reduce((sum, item) => sum + item.recoverable, 0) ?? 0;
  const accounts = data?.debtSegments.reduce((sum, item) => sum + item.affectedAccounts, 0) ?? 0;
  const causes = data?.badDebtCases.reduce<Record<string, number>>((result, item) => ({ ...result, [item.cause]: (result[item.cause] ?? 0) + item.amount }), {}) ?? {};
  const causeNames: Record<string, string> = { 'oracle-gap': c.oracle, liquidity: c.liquidity, volatility: c.volatility, execution: c.execution };
  const maxCause = Math.max(1, ...Object.values(causes));

  return (
    <AppShell eyebrow={c.eyebrow} title={c.title} description={c.description}>
      <OperationsState loading={loading} error={error} language={language} onRetry={() => void reload()} />
      {data ? <>
        <MetricStrip items={[
          { label: c.current, value: formatCompactUsd(totalDebt, language), detail: c.ofBorrow, tone: 'danger' },
          { label: c.coverage, value: `${(provisioned / totalDebt * 100).toFixed(1)}%`, detail: c.coverageTarget },
          { label: c.recoverable, value: formatCompactUsd(recoverable, language), detail: c.recoveryRate, tone: 'positive' },
          { label: c.accounts, value: accounts, detail: `${data.badDebtCases.filter((item) => item.status !== 'contained').length} ${c.activeCases}` },
        ]} />
        <section className="ops-split-grid debt-top-grid">
          <article className="panel"><div className="panel-heading"><div><p className="eyebrow">{c.exposure}</p><h2>{c.coverageTitle}</h2></div><span className="panel-meta">USD</span></div><DebtCoverageChart segments={data.debtSegments} labels={{ badDebt: c.badDebt, provisioned: c.provisioned, recoverable: c.recoverableShort }} /></article>
          <article className="panel cause-panel"><div className="panel-heading"><div><p className="eyebrow">{c.causes}</p><h2>{c.rootCause}</h2></div><CircleDollarSign size={18} /></div>
            <div className="cause-list">{Object.entries(causes).sort((a, b) => b[1] - a[1]).map(([name, value]) => <button className={cause === name ? 'active' : ''} key={name} onClick={() => setCause(cause === name ? 'all' : name)}>
              <span><i className={`cause-dot ${name}`} />{causeNames[name]}</span><strong>{formatCompactUsd(value, language)}</strong><em><i style={{ width: `${value / maxCause * 100}%` }} /></em>
            </button>)}</div>
            <div className="recovery-note"><ShieldAlert size={17} /><div><strong>{language === 'zh' ? '优先处置建议' : 'Priority recommendation'}</strong><p>{language === 'zh' ? '先处理 wstETH 与 ETH 的高回收率案例，可覆盖当前可追偿金额的 61%。' : 'Prioritize high-recovery wstETH and ETH cases, covering 61% of expected recoveries.'}</p></div></div>
          </article>
        </section>
        <section className="panel data-panel ops-table-panel">
          <div className="ops-toolbar"><div><p className="eyebrow">{c.cases}</p><h2>{c.caseTitle}</h2></div><SegmentTabs label="segment" value={segment} onChange={setSegment} items={[
            { value: 'all', label: c.all, count: data.badDebtCases.length }, { value: 'V3', label: 'V3' }, { value: 'V2', label: 'V2' }, { value: 'TRON', label: 'TRON' }, { value: 'Ethereum', label: 'Ethereum' },
          ]} /></div>
          <div className="table-wrap ops-table"><table><thead><tr><th>{c.id}</th><th>{c.market}</th><th>{c.network}</th><th>{c.amount}</th><th>{c.cause}</th><th>{c.health}</th><th>{c.age}</th><th>{c.rec}</th><th>{c.state}</th></tr></thead>
            <tbody>{cases.length ? cases.map((item) => <tr key={item.id}>
              <td><span className="record-id">{item.id}</span></td><td><span className="asset-icon">{item.market[0]}</span><div><strong>{item.market}</strong><small>{item.version}</small></div></td><td>{item.network}</td><td className="danger">{formatCompactUsd(item.amount, language)}</td><td>{causeNames[item.cause]}</td><td>{item.healthFactor.toFixed(2)}</td><td>{item.ageHours} {c.hours}</td><td>{formatCompactUsd(item.recoverable, language)}</td><td><StatusBadge status={item.status} label={statusLabel(item.status, language)} /></td>
            </tr>) : <tr><td className="table-empty" colSpan={9}>{c.empty}</td></tr>}</tbody>
          </table></div>
        </section>
        <p className="data-footnote"><WalletCards size={13} />{language === 'zh' ? '坏账敞口为合成演示数据，处置流程与指标口径按真实运营系统设计。' : 'Bad-debt exposure is synthetic; workflows and metric definitions mirror a production operations system.'}</p>
      </> : null}
    </AppShell>
  );
}
