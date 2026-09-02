'use client';

import { BellRing, ShieldCheck } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { AlertRule } from '@/lib/types';
import { AppShell } from './AppShell';
import { formatDate } from './Format';
import { useI18n } from './I18n';
import { localizeRuleName, severityLabel } from './Localize';

const operatorLabel = { gt: '>', gte: '≥', lt: '<', lte: '≤' } as const;

export default function RulesView() {
  const { language, locale, t } = useI18n();
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
    <AppShell eyebrow={t('rulesEyebrow')} title={t('rulesTitle')} description={t('rulesDescription')}>
      <section className="rules-summary">
        <div><ShieldCheck size={20} /><span><strong>{t('activeRules', { count: enabledCount })}</strong><small>{t('evaluatedEveryCycle')}</small></span></div>
        <p>{t('sharedDemoNote')}</p>
      </section>
      <section className="rule-grid">
        {rules.map((rule) => {
          const name = localizeRuleName(rule, language);
          const unit = language === 'zh' && rule.unit === 'ratio' ? '倍' : rule.unit;
          return (
            <article className={`rule-card ${rule.enabled ? '' : 'disabled'}`} key={rule.id}>
              <div className="rule-card-head">
                <span className={`rule-icon ${rule.severity}`}><BellRing size={16} /></span>
                <button aria-label={t(rule.enabled ? 'disableRule' : 'enableRule', { name })} className={`toggle ${rule.enabled ? 'on' : ''}`} disabled={busyId === rule.id} onClick={() => void toggle(rule)}><i /></button>
              </div>
              <span className={`severity-label ${rule.severity}`}>{severityLabel(rule.severity, language)}</span>
              <h2>{name}</h2>
              <p>{t('triggerWhen')} <code>{rule.metric}</code> {t('is')} {operatorLabel[rule.operator]} <strong>{rule.threshold.toLocaleString(locale)} {unit}</strong>.</p>
              <small>{rule.enabled ? t('enabled') : t('disabled')} · {t('updated', { date: formatDate(rule.updatedAt, locale) })}</small>
            </article>
          );
        })}
      </section>
    </AppShell>
  );
}
