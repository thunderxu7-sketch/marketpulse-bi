'use client';

import { Check, CircleAlert, Clock3, Search, ShieldCheck, X } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { RiskEvent } from '@/lib/types';
import { AppShell } from './AppShell';
import { formatTime } from './Format';
import { useI18n } from './I18n';
import { localizeEvent, severityLabel } from './Localize';
import { MetricStrip, statusLabel, StatusBadge } from './operations/shared';

export default function EventsView() {
  const { language, locale, t } = useI18n();
  const [events, setEvents] = useState<RiskEvent[]>([]);
  const [status, setStatus] = useState('all');
  const [severity, setSeverity] = useState('all');
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<RiskEvent | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const response = await fetch(`/api/events?${new URLSearchParams({ status, severity })}`, { cache: 'no-store' });
    const payload = await response.json() as { events: RiskEvent[] };
    setEvents(payload.events ?? []);
    setLoading(false);
  }, [severity, status]);

  useEffect(() => {
    // This effect intentionally synchronizes the filtered view with the events API.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  const acknowledge = async (id: number) => {
    setBusyId(id);
    const response = await fetch(`/api/events/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'acknowledged' }),
    });
    if (response.ok) await load();
    setBusyId(null);
  };

  const counts = useMemo(() => ({
    open: events.filter((event) => event.status === 'open').length,
    critical: events.filter((event) => event.severity === 'critical').length,
    acknowledged: events.filter((event) => event.status === 'acknowledged').length,
  }), [events]);
  const visibleEvents = useMemo(() => {
    const query = search.trim().toLowerCase();
    return events.filter((event) => !query || `${event.title} ${event.detail} ${event.symbol ?? ''} ${event.eventType}`.toLowerCase().includes(query));
  }, [events, search]);
  const c = language === 'zh' ? {
    sla: '响应 SLA', slaValue: '4分12秒', slaDetail: 'P90 · 目标 10 分钟', coverage: '规则覆盖', coverageValue: '18 / 21', coverageDetail: '3 条规则处于观察期', search: '搜索事件、市场或类型', details: '告警详情', close: '关闭详情', classification: '事件分类', occurred: '发生时间', owner: '处置责任人', ownerValue: '风险运营值班台', playbook: '建议处置流程', playbookCopy: '核验关联市场与价格源；确认敞口变化；记录处置结论并关闭告警。', noOwner: '等待分派',
  } : {
    sla: 'Response SLA', slaValue: '4m 12s', slaDetail: 'P90 · 10 minute target', coverage: 'Rule coverage', coverageValue: '18 / 21', coverageDetail: '3 rules in observation', search: 'Search event, market, or type', details: 'Alert details', close: 'Close details', classification: 'Classification', occurred: 'Occurred', owner: 'Response owner', ownerValue: 'Risk operations desk', playbook: 'Recommended playbook', playbookCopy: 'Validate the related market and feeds, confirm exposure movement, then document the outcome and close the alert.', noOwner: 'Awaiting assignment',
  };

  return (
    <AppShell eyebrow={t('eventsEyebrow')} title={t('eventsTitle')} description={t('eventsDescription')}>
      <MetricStrip items={[
        { label: t('visibleOpenEvents'), value: counts.open, detail: `${counts.critical} ${t('severityCritical')}`, tone: counts.critical ? 'danger' : '' },
        { label: t('acknowledgedCount'), value: counts.acknowledged, detail: language === 'zh' ? '当前筛选范围' : 'Current filter scope', tone: 'positive' },
        { label: c.sla, value: c.slaValue, detail: c.slaDetail },
        { label: c.coverage, value: c.coverageValue, detail: c.coverageDetail },
      ]} />
      <section className="panel data-panel">
        <div className="filter-row event-filter-row">
          <label className="search-field event-search"><Search size={14} /><input aria-label={c.search} placeholder={c.search} value={search} onChange={(event) => setSearch(event.target.value)} /></label>
          <label><span>{t('status')}</span><select value={status} onChange={(event) => setStatus(event.target.value)}><option value="all">{t('allStatuses')}</option><option value="open">{t('statusOpen')}</option><option value="acknowledged">{t('statusAcknowledged')}</option></select></label>
          <label><span>{t('severity')}</span><select value={severity} onChange={(event) => setSeverity(event.target.value)}><option value="all">{t('allSeverities')}</option><option value="critical">{t('severityCritical')}</option><option value="warning">{t('severityWarning')}</option><option value="info">{t('severityInfo')}</option></select></label>
        </div>
        <div className="event-timeline">
          {loading ? <p className="table-empty">{t('loadingEvents')}</p> : visibleEvents.length ? visibleEvents.map((event) => {
            const localized = localizeEvent(event, language);
            return (
              <article className="timeline-row clickable-row" key={event.id} onClick={() => setSelected(event)}>
                <span className={`timeline-icon ${event.severity}`}><CircleAlert size={16} /></span>
                <div className="timeline-copy">
                  <div className="timeline-title"><span className={`severity-label ${event.severity}`}>{severityLabel(event.severity, language)}</span><h2>{localized.title}</h2>{event.symbol ? <span className="market-chip">{event.symbol}</span> : null}</div>
                  <p>{localized.detail}</p>
                  <small><Clock3 size={12} />{formatTime(event.occurredAt, locale)} · {event.eventType.replaceAll('_', ' ')}</small>
                </div>
                {event.status === 'open' ? (
                  <button className="ghost-button acknowledge-button" disabled={busyId === event.id} onClick={(click) => { click.stopPropagation(); void acknowledge(event.id); }}><Check size={14} />{busyId === event.id ? t('saving') : t('acknowledge')}</button>
                ) : <span className="acknowledged-label"><Check size={13} />{t('acknowledged')}</span>}
              </article>
            );
          }) : <p className="table-empty">{t('noEvents')}</p>}
        </div>
      </section>
      {selected ? (() => {
        const localized = localizeEvent(selected, language);
        return <aside className="detail-drawer" aria-label={c.details}>
          <div className="drawer-head"><div><p className="eyebrow">{c.details}</p><h2>{localized.title}</h2></div><button aria-label={c.close} onClick={() => setSelected(null)}><X size={17} /></button></div>
          <div className="drawer-observation"><CircleAlert size={20} /><div><span>{c.classification}</span><strong>{severityLabel(selected.severity, language)}</strong></div><StatusBadge status={selected.status} label={statusLabel(selected.status, language)} /></div>
          <p className="drawer-event-copy">{localized.detail}</p>
          <dl className="drawer-facts"><div><dt>{t('market')}</dt><dd>{selected.symbol ?? 'Portfolio'}</dd></div><div><dt>{c.classification}</dt><dd>{selected.eventType.replaceAll('_', ' ')}</dd></div><div><dt>{c.occurred}</dt><dd>{formatTime(selected.occurredAt, locale)}</dd></div><div><dt>{c.owner}</dt><dd>{selected.status === 'acknowledged' ? c.ownerValue : c.noOwner}</dd></div></dl>
          <div className="drawer-note"><ShieldCheck size={17} /><div><strong>{c.playbook}</strong><p>{c.playbookCopy}</p></div></div>
        </aside>;
      })() : null}
    </AppShell>
  );
}
