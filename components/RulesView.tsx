'use client';

import { BellRing, ShieldCheck } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { AlertRule } from '@/lib/types';
import { AppShell } from './AppShell';

const operatorLabel = { gt: '>', gte: '≥', lt: '<', lte: '≤' } as const;

export default function RulesView() {
  const [rules, setRules] = useState<AlertRule[]>([]);
  const [busyId, setBusyId] = useState<number | null>(null);

  const load = useCallback(async () => {
    const response = await fetch('/api/rules', { cache: 'no-store' });
    const payload = await response.json() as { rules: AlertRule[] };
    setRules(payload.rules ?? []);
  }, []);

  useEffect(() => {
    // This effect intentionally synchronizes the client with the persisted rule set.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  const toggle = async (rule: AlertRule) => {
    setBusyId(rule.id);
    const response = await fetch(`/api/rules/${rule.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ enabled: !rule.enabled }),
    });
    if (response.ok) await load();
    setBusyId(null);
  };

  const enabledCount = useMemo(() => rules.filter((rule) => rule.enabled).length, [rules]);

  return (
    <AppShell eyebrow="Policy configuration" title="Alert rules" description="Persistent D1-backed thresholds used to classify financial risk signals.">
      <section className="rules-summary">
        <div><ShieldCheck size={20} /><span><strong>{enabledCount} active rules</strong><small>Evaluated on every monitoring cycle</small></span></div>
        <p>This public portfolio uses synthetic data. Rule changes persist in the shared demo database.</p>
      </section>
      <section className="rule-grid">
        {rules.map((rule) => (
          <article className={`rule-card ${rule.enabled ? '' : 'disabled'}`} key={rule.id}>
            <div className="rule-card-head">
              <span className={`rule-icon ${rule.severity}`}><BellRing size={16} /></span>
              <button aria-label={`${rule.enabled ? 'Disable' : 'Enable'} ${rule.name}`} className={`toggle ${rule.enabled ? 'on' : ''}`} disabled={busyId === rule.id} onClick={() => void toggle(rule)}><i /></button>
            </div>
            <span className={`severity-label ${rule.severity}`}>{rule.severity}</span>
            <h2>{rule.name}</h2>
            <p>Trigger when <code>{rule.metric}</code> is {operatorLabel[rule.operator]} <strong>{rule.threshold.toLocaleString()} {rule.unit}</strong>.</p>
            <small>{rule.enabled ? 'Enabled' : 'Disabled'} · Updated {new Date(rule.updatedAt).toLocaleDateString('en-US')}</small>
          </article>
        ))}
      </section>
    </AppShell>
  );
}
