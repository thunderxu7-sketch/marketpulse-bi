'use client';

import { Bot, CheckCircle2, Clock3, PauseCircle, PlayCircle, ShieldCheck, TriangleAlert } from 'lucide-react';
import { useMemo, useState } from 'react';
import { AppShell } from '@/components/AppShell';
import { useI18n } from '@/components/I18n';
import type { AutomationAgent } from '@/lib/types';
import { localizeAgent, MetricStrip, OperationsState, statusLabel, StatusBadge, useOperationsData } from './shared';

export default function AutomationView() {
  const { language, locale } = useI18n();
  const { data, loading, error, reload } = useOperationsData();
  const [busyId, setBusyId] = useState<number | null>(null);
  const [runFilter, setRunFilter] = useState('all');
  const c = language === 'zh' ? {
    eyebrow: '数据监控 / 自动化', title: '自动化机器人监测', description: '监控价格校验、清算、再平衡与收入归集任务的可用性、成功率、延迟和执行记录。',
    uptime: '自动化可用率', runs: '24 小时执行', success: '综合成功率', exceptions: '异常任务', sla: '过去 30 天 SLA', across: '覆盖全部机器人', target: '目标 ≥ 99.5%', needsReview: '需要人工复核', fleet: '机器人集群', fleetTitle: '任务执行健康度', pause: '暂停', resume: '恢复', runs24: '24h 执行', latency: '中位延迟', lastRun: '最近执行', mission: '任务职责', scope: '覆盖范围',
    log: '执行记录', logTitle: '最近自动化任务', all: '全部', warnings: '异常', id: '任务编号', agent: '机器人', task: '任务', market: '市场', started: '开始时间', duration: '耗时', result: '结果', saved: '状态已保存',
  } : {
    eyebrow: 'Data monitoring / Automation', title: 'Automation monitoring', description: 'Monitor availability, success, latency, and execution history for oracle, liquidation, rebalancing, and revenue jobs.',
    uptime: 'Automation uptime', runs: '24h executions', success: 'Blended success rate', exceptions: 'Exception tasks', sla: '30-day SLA', across: 'Across all agents', target: 'Target ≥ 99.5%', needsReview: 'Require operator review', fleet: 'Agent fleet', fleetTitle: 'Task execution health', pause: 'Pause', resume: 'Resume', runs24: '24h runs', latency: 'Median latency', lastRun: 'Last run', mission: 'Mission', scope: 'Scope',
    log: 'Execution log', logTitle: 'Recent automation tasks', all: 'All', warnings: 'Exceptions', id: 'Run ID', agent: 'Agent', task: 'Task', market: 'Market', started: 'Started', duration: 'Duration', result: 'Result', saved: 'State saved',
  };
  const runs = useMemo(() => (data?.automationRuns ?? []).filter((run) => runFilter === 'all' || run.result !== 'success'), [data, runFilter]);
  const enabledAgents = data?.automationAgents.filter((agent) => agent.enabled) ?? [];
  const totalRuns = enabledAgents.reduce((sum, agent) => sum + agent.runs24h, 0);
  const weightedSuccess = enabledAgents.length ? enabledAgents.reduce((sum, agent) => sum + agent.successRate, 0) / enabledAgents.length : 0;
  const exceptionCount = data?.automationRuns.filter((run) => run.result !== 'success').length ?? 0;
  const taskNames: Record<string, string> = language === 'zh' ? {
    'Validate composite price': '校验聚合价格', 'Scan unhealthy positions': '扫描风险仓位', 'Rebalance reserve buffer': '再平衡储备缓冲', 'Settle protocol accrual': '结算协议应计收入', 'Evaluate concentration limit': '评估集中度限额',
  } : {};
  const toggleAgent = async (agent: AutomationAgent) => {
    setBusyId(agent.id);
    const response = await fetch(`/api/agents/${agent.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ enabled: !agent.enabled }) });
    if (response.ok) await reload();
    setBusyId(null);
  };

  return (
    <AppShell eyebrow={c.eyebrow} title={c.title} description={c.description}>
      <OperationsState loading={loading} error={error} language={language} onRetry={() => void reload()} />
      {data ? <>
        <MetricStrip items={[
          { label: c.uptime, value: '99.94%', detail: c.sla, tone: 'positive' },
          { label: c.runs, value: totalRuns.toLocaleString(locale), detail: c.across },
          { label: c.success, value: `${weightedSuccess.toFixed(2)}%`, detail: c.target, tone: weightedSuccess >= 99.5 ? 'positive' : 'amber' },
          { label: c.exceptions, value: exceptionCount, detail: c.needsReview, tone: exceptionCount ? 'danger' : '' },
        ]} />
        <section className="panel automation-fleet">
          <div className="panel-heading"><div><p className="eyebrow">{c.fleet}</p><h2>{c.fleetTitle}</h2></div><span className="panel-meta"><span className="live-dot compact-dot" /> 5 agents</span></div>
          <div className="agent-grid">{data.automationAgents.map((agent) => {
            const localized = localizeAgent(agent, language);
            return <article className={`agent-card ${!agent.enabled ? 'paused' : ''}`} key={agent.id}>
              <div className="agent-head"><span className={`agent-icon ${agent.status}`}><Bot size={18} /></span><StatusBadge status={agent.status} label={statusLabel(agent.status, language)} /></div>
              <h3>{localized.name}</h3><p>{localized.mission}</p><small>{localized.scope}</small>
              <div className="agent-score"><div><span>{c.success}</span><strong>{agent.successRate.toFixed(2)}%</strong></div><em><i style={{ width: `${agent.successRate}%` }} /></em></div>
              <dl><div><dt>{c.runs24}</dt><dd>{agent.runs24h.toLocaleString(locale)}</dd></div><div><dt>{c.latency}</dt><dd>{agent.medianLatencyMs} ms</dd></div><div><dt>{c.lastRun}</dt><dd>{new Date(agent.lastRunAt).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit', hour12: false })}</dd></div></dl>
              <button className={agent.enabled ? 'agent-control pause' : 'agent-control'} disabled={busyId === agent.id} onClick={() => void toggleAgent(agent)}>{agent.enabled ? <PauseCircle size={14} /> : <PlayCircle size={14} />}{agent.enabled ? c.pause : c.resume}</button>
            </article>;
          })}</div>
        </section>
        <section className="panel data-panel ops-table-panel">
          <div className="ops-toolbar"><div><p className="eyebrow">{c.log}</p><h2>{c.logTitle}</h2></div><div className="segment-tabs"><button className={runFilter === 'all' ? 'active' : ''} onClick={() => setRunFilter('all')}>{c.all}</button><button className={runFilter === 'exceptions' ? 'active' : ''} onClick={() => setRunFilter('exceptions')}>{c.warnings}<span>{exceptionCount}</span></button></div></div>
          <div className="table-wrap ops-table"><table><thead><tr><th>{c.id}</th><th>{c.agent}</th><th>{c.task}</th><th>{c.market}</th><th>{c.started}</th><th>{c.duration}</th><th>{c.result}</th></tr></thead><tbody>
            {runs.map((run) => { const agent = data.automationAgents.find((item) => item.id === run.agentId); const localized = agent ? localizeAgent(agent, language) : null; return <tr key={run.id}>
              <td><span className="record-id">{run.id}</span></td><td><div className="table-agent"><span className={`mini-run-icon ${run.result}`}>{run.result === 'success' ? <CheckCircle2 size={13} /> : <TriangleAlert size={13} />}</span><strong>{localized?.name ?? run.agentName}</strong></div></td><td>{taskNames[run.task] ?? run.task}</td><td><span className="market-chip">{run.market}</span></td><td><Clock3 size={12} /> {new Date(run.startedAt).toLocaleString(locale, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false })}</td><td>{run.durationMs.toLocaleString(locale)} ms</td><td><StatusBadge status={run.result} label={statusLabel(run.result, language)} /></td>
            </tr>; })}
          </tbody></table></div>
        </section>
        <div className="ops-assurance"><ShieldCheck size={15} /><span>{language === 'zh' ? '启停状态通过后端接口持久化；机器人执行数据为安全的合成演示记录。' : 'Agent enablement is persisted through the backend API; execution records are safe synthetic demo data.'}</span></div>
      </> : null}
    </AppShell>
  );
}
