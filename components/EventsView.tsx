'use client';

import { Check, CircleAlert, Clock3 } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { RiskEvent } from '@/lib/types';
import { AppShell } from './AppShell';
import { formatTime } from './Format';
import { useI18n } from './I18n';
import { localizeEvent, severityLabel } from './Localize';

export default function EventsView() {
  const { language, locale, t } = useI18n();
  const [events, setEvents] = useState<RiskEvent[]>([]);
  const [status, setStatus] = useState('all');
  const [severity, setSeverity] = useState('all');
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);

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

  return (
    <AppShell eyebrow={t('eventsEyebrow')} title={t('eventsTitle')} description={t('eventsDescription')}>
      <section className="compact-metrics">
        <div><span>{t('visibleOpenEvents')}</span><strong>{counts.open}</strong></div>
        <div><span>{t('criticalSignalsLabel')}</span><strong>{counts.critical}</strong></div>
        <div><span>{t('acknowledgedCount')}</span><strong>{counts.acknowledged}</strong></div>
      </section>
      <section className="panel data-panel">
        <div className="filter-row event-filter-row">
          <label><span>{t('status')}</span><select value={status} onChange={(event) => setStatus(event.target.value)}><option value="all">{t('allStatuses')}</option><option value="open">{t('statusOpen')}</option><option value="acknowledged">{t('statusAcknowledged')}</option></select></label>
          <label><span>{t('severity')}</span><select value={severity} onChange={(event) => setSeverity(event.target.value)}><option value="all">{t('allSeverities')}</option><option value="critical">{t('severityCritical')}</option><option value="warning">{t('severityWarning')}</option><option value="info">{t('severityInfo')}</option></select></label>
        </div>
        <div className="event-timeline">
          {loading ? <p className="table-empty">{t('loadingEvents')}</p> : events.length ? events.map((event) => {
            const localized = localizeEvent(event, language);
            return (
              <article className="timeline-row" key={event.id}>
                <span className={`timeline-icon ${event.severity}`}><CircleAlert size={16} /></span>
                <div className="timeline-copy">
                  <div className="timeline-title"><span className={`severity-label ${event.severity}`}>{severityLabel(event.severity, language)}</span><h2>{localized.title}</h2>{event.symbol ? <span className="market-chip">{event.symbol}</span> : null}</div>
                  <p>{localized.detail}</p>
                  <small><Clock3 size={12} />{formatTime(event.occurredAt, locale)} · {event.eventType.replaceAll('_', ' ')}</small>
                </div>
                {event.status === 'open' ? (
                  <button className="ghost-button acknowledge-button" disabled={busyId === event.id} onClick={() => void acknowledge(event.id)}><Check size={14} />{busyId === event.id ? t('saving') : t('acknowledge')}</button>
                ) : <span className="acknowledged-label"><Check size={13} />{t('acknowledged')}</span>}
              </article>
            );
          }) : <p className="table-empty">{t('noEvents')}</p>}
        </div>
      </section>
    </AppShell>
  );
}
