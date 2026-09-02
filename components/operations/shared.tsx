'use client';

import { AlertTriangle, LoaderCircle } from 'lucide-react';
import type { ReactNode } from 'react';
import { useCallback, useEffect, useState } from 'react';
import type { Language } from '@/components/I18n';
import type { OperationsData, OperationalStatus, TeamRole } from '@/lib/types';

export function useOperationsData() {
  const [data, setData] = useState<OperationsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const response = await fetch('/api/operations', { cache: 'no-store' });
      if (!response.ok) throw new Error('Operations API unavailable');
      setData(await response.json() as OperationsData);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    // Synchronize operational views with the shared analytics endpoint.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);
  return { data, loading, error, reload: load };
}

export function OperationsState({
  loading,
  error,
  language,
  onRetry,
}: {
  loading: boolean;
  error: boolean;
  language: Language;
  onRetry: () => void;
}) {
  if (loading) return (
    <section className="panel operations-state">
      <LoaderCircle className="spin" size={20} />
      <span>{language === 'zh' ? '正在加载运营数据…' : 'Loading operational data…'}</span>
    </section>
  );
  if (error) return (
    <section className="panel operations-state error-state">
      <AlertTriangle size={20} />
      <span>{language === 'zh' ? '运营数据暂时不可用' : 'Operational data is unavailable'}</span>
      <button className="ghost-button" onClick={onRetry}>{language === 'zh' ? '重试' : 'Try again'}</button>
    </section>
  );
  return null;
}

export function MetricStrip({ items }: { items: Array<{ label: string; value: ReactNode; detail?: string; tone?: string }> }) {
  return (
    <section className={`ops-metric-grid columns-${Math.min(items.length, 4)}`}>
      {items.map((item) => (
        <article className="ops-metric" key={item.label}>
          <span>{item.label}</span>
          <strong className={item.tone ?? ''}>{item.value}</strong>
          {item.detail ? <small>{item.detail}</small> : null}
        </article>
      ))}
    </section>
  );
}

export function SegmentTabs({
  items,
  value,
  onChange,
  label,
}: {
  items: Array<{ value: string; label: string; count?: number }>;
  value: string;
  onChange: (value: string) => void;
  label: string;
}) {
  return (
    <div className="segment-tabs" role="tablist" aria-label={label}>
      {items.map((item) => (
        <button
          aria-selected={value === item.value}
          className={value === item.value ? 'active' : ''}
          key={item.value}
          onClick={() => onChange(item.value)}
          role="tab"
          type="button"
        >
          {item.label}{typeof item.count === 'number' ? <span>{item.count}</span> : null}
        </button>
      ))}
    </div>
  );
}

export function StatusBadge({ status, label }: { status: OperationalStatus | string; label: string }) {
  return <span className={`ops-status ${status}`}>{label}</span>;
}

export function formatCompactUsd(value: number, language: Language, digits = 1) {
  return new Intl.NumberFormat(language === 'zh' ? 'zh-CN' : 'en-US', {
    style: 'currency',
    currency: 'USD',
    notation: 'compact',
    maximumFractionDigits: digits,
  }).format(value);
}

export function downloadCsv(filename: string, rows: Array<Array<string | number>>) {
  const escapeCell = (value: string | number) => `"${String(value).replaceAll('"', '""')}"`;
  const blob = new Blob([`\uFEFF${rows.map((row) => row.map(escapeCell).join(',')).join('\n')}`], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function statusLabel(status: string, language: Language) {
  const en: Record<string, string> = {
    healthy: 'Healthy', watch: 'Watch', critical: 'Critical', paused: 'Paused',
    success: 'Success', warning: 'Warning', failed: 'Failed',
    investigating: 'Investigating', recovering: 'Recovering', contained: 'Contained',
    normal: 'Normal', review: 'Review', high: 'High',
    settled: 'Settled', pending: 'Pending', active: 'Active', invited: 'Invited',
    open: 'Open', acknowledged: 'Acknowledged',
  };
  const zh: Record<string, string> = {
    healthy: '健康', watch: '关注', critical: '严重', paused: '已暂停',
    success: '成功', warning: '警告', failed: '失败',
    investigating: '调查中', recovering: '追偿中', contained: '已控制',
    normal: '正常', review: '复核', high: '高风险',
    settled: '已结算', pending: '处理中', active: '已启用', invited: '待加入',
    open: '待处理', acknowledged: '已确认',
  };
  return (language === 'zh' ? zh : en)[status] ?? status;
}

export function roleLabel(role: TeamRole, language: Language) {
  const en = { owner: 'Owner', risk: 'Risk analyst', operator: 'Operator', viewer: 'Viewer' };
  const zh = { owner: '负责人', risk: '风险分析师', operator: '运营人员', viewer: '只读成员' };
  return (language === 'zh' ? zh : en)[role];
}

export function localizeAgent(agent: { id: number; name: string; mission: string; scope: string }, language: Language) {
  if (language === 'en') return agent;
  const values: Record<number, { name: string; mission: string; scope: string }> = {
    1: { name: '价格源哨兵', mission: '跨数据源价格校验', scope: '6 个市场 · 14 个价格源' },
    2: { name: '清算守护者', mission: '仓位健康扫描与执行', scope: '3 条网络 · 4 个队列' },
    3: { name: '流动性再平衡器', mission: '储备金与流动性缓冲调度', scope: '9 条流动性路径' },
    4: { name: '收入归集器', mission: '应计结算与收入核算', scope: '12 条收入流' },
    5: { name: '敞口防线', mission: '集中度与限额执行', scope: '18 项策略约束' },
  };
  return values[agent.id] ?? agent;
}

export function localizeTeamName(id: number, fallback: string, language: Language) {
  if (language === 'en') return fallback;
  return ({ 1: '平台负责人', 2: '风险负责人', 3: '运营值班台', 4: '财务观察员', 5: '审计观察员' } as Record<number, string>)[id] ?? fallback;
}
