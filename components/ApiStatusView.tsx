'use client';

import { CheckCircle2, Database, Server, ShieldCheck, TriangleAlert } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { AppShell } from './AppShell';
import { formatTime } from './Format';
import { useI18n } from './I18n';

interface Health { status: string; database: string; markets: number; timestamp: string }

export default function ApiStatusView() {
  const { locale, t } = useI18n();
  const [health, setHealth] = useState<Health | null>(null);
  const [failed, setFailed] = useState(false);

  const isPages = health?.database === 'browser-storage'
    || (typeof window !== 'undefined' && window.location.hostname.endsWith('github.io'));

  useEffect(() => {
    void fetch('/api/health', { cache: 'no-store' })
      .then((response) => {
        if (!response.ok) throw new Error('Health check failed');
        return response.json();
      })
      .then((value) => setHealth(value as Health))
      .catch(() => setFailed(true));
  }, []);

  const endpoints = useMemo(() => [
    ['GET', '/api/dashboard', t('endpointDashboard')],
    ['GET', '/api/markets', t('endpointMarkets')],
    ['GET', '/api/operations', t('endpointOperations')],
    ['GET', '/api/events', t('endpointEvents')],
    ['PATCH', '/api/events/:id', t('endpointEventPatch')],
    ['GET', '/api/rules', t('endpointRules')],
    ['PATCH', '/api/rules/:id', t('endpointRulePatch')],
    ['PATCH', '/api/agents/:id', t('endpointAgentPatch')],
    ['PATCH', '/api/team/:id', t('endpointTeamPatch')],
    ['POST', '/api/refresh', t('endpointRefresh')],
  ], [t]);

  const headline = failed ? t('servicesUnavailable') : health ? t('systemsOperational') : t('checkingServices');
  const detail = health ? t('verifiedAt', { time: formatTime(health.timestamp, locale) }) : t('connectingHealth');

  return (
    <AppShell eyebrow={t('apiEyebrow')} title={t('apiTitle')} description={t(isPages ? 'apiDescriptionPages' : 'apiDescription')}>
      <section className="health-hero panel">
        <div className={`health-icon ${failed ? 'failed' : ''}`}>{failed ? <TriangleAlert size={24} /> : <CheckCircle2 size={24} />}</div>
        <div><p className="eyebrow">{t('currentStatus')}</p><h2>{headline}</h2><span>{detail}</span></div>
        <span className={`operational-badge ${failed ? 'failed' : ''}`}>{failed ? t('unavailable') : t('operational')}</span>
      </section>
      <section className="service-grid">
        <article className="panel service-card"><Server size={19} /><span><strong>{t('edgeApi')}</strong><small>{t(isPages ? 'localApiDescription' : 'edgeApiDescription')}</small></span><b>{failed ? t('unavailable') : t('healthy')}</b></article>
        <article className="panel service-card"><Database size={19} /><span><strong>{t(isPages ? 'browserDatabase' : 'database')}</strong><small>{health ? t('seededMarkets', { count: health.markets }) : t(isPages ? 'browserPersistence' : 'edgeSqlite')}</small></span><b>{failed ? t('unavailable') : t('connected')}</b></article>
        <article className="panel service-card"><ShieldCheck size={19} /><span><strong>{t('writeControls')}</strong><small>{t('writeControlsDescription')}</small></span><b>{t('enabledLabel')}</b></article>
      </section>
      <section className="panel endpoint-panel">
        <div className="panel-heading"><div><p className="eyebrow">{t('backendSurface')}</p><h2>{t('apiEndpoints')}</h2></div><span className="panel-meta">{t('jsonNoStore')}</span></div>
        <div className="endpoint-list">{endpoints.map(([method, path, description]) => (
          <div key={`${method}-${path}`}><span className={`method ${method.toLowerCase()}`}>{method}</span><code>{path}</code><p>{description}</p></div>
        ))}</div>
      </section>
    </AppShell>
  );
}
