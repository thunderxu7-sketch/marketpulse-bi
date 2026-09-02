'use client';

import { Check, CircleAlert, Clock3 } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { RiskEvent } from '@/lib/types';
import { AppShell } from './AppShell';
import { formatTime } from './Format';

export default function EventsView() {
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
    <AppShell eyebrow="Operational response" title="Risk events" description="Review system signals and persist acknowledgement state through the monitoring API.">
      <section className="compact-metrics">
        <div><span>Visible open events</span><strong>{counts.open}</strong></div>
        <div><span>Critical signals</span><strong>{counts.critical}</strong></div>
        <div><span>Acknowledged</span><strong>{counts.acknowledged}</strong></div>
      </section>
      <section className="panel data-panel">
        <div className="filter-row event-filter-row">
          <label><span>Status</span><select value={status} onChange={(event) => setStatus(event.target.value)}><option value="all">All statuses</option><option value="open">Open</option><option value="acknowledged">Acknowledged</option></select></label>
          <label><span>Severity</span><select value={severity} onChange={(event) => setSeverity(event.target.value)}><option value="all">All severities</option><option value="critical">Critical</option><option value="warning">Warning</option><option value="info">Info</option></select></label>
        </div>
        <div className="event-timeline">
          {loading ? <p className="table-empty">Loading risk events…</p> : events.length ? events.map((event) => (
            <article className="timeline-row" key={event.id}>
              <span className={`timeline-icon ${event.severity}`}><CircleAlert size={16} /></span>
              <div className="timeline-copy">
                <div className="timeline-title"><span className={`severity-label ${event.severity}`}>{event.severity}</span><h2>{event.title}</h2>{event.symbol ? <span className="market-chip">{event.symbol}</span> : null}</div>
                <p>{event.detail}</p>
                <small><Clock3 size={12} />{formatTime(event.occurredAt)} · {event.eventType.replaceAll('_', ' ')}</small>
              </div>
              {event.status === 'open' ? (
                <button className="ghost-button acknowledge-button" disabled={busyId === event.id} onClick={() => void acknowledge(event.id)}><Check size={14} />{busyId === event.id ? 'Saving…' : 'Acknowledge'}</button>
              ) : <span className="acknowledged-label"><Check size={13} />Acknowledged</span>}
            </article>
          )) : <p className="table-empty">No events match these filters.</p>}
        </div>
      </section>
    </AppShell>
  );
}
