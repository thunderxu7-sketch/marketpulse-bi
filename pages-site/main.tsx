import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import ApiStatusView from '@/components/ApiStatusView';
import Dashboard from '@/components/Dashboard';
import EventsView from '@/components/EventsView';
import { I18nProvider } from '@/components/I18n';
import MarketsView from '@/components/MarketsView';
import RulesView from '@/components/RulesView';
import { usePathname } from 'next/navigation';
import '@/app/globals.css';
import { installLocalApi } from './mock-api';

installLocalApi();

function RouteView() {
  const pathname = usePathname();
  if (pathname === '/markets') return <MarketsView />;
  if (pathname === '/events') return <EventsView />;
  if (pathname === '/rules') return <RulesView />;
  if (pathname === '/api-status') return <ApiStatusView />;
  return <Dashboard />;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <I18nProvider><RouteView /></I18nProvider>
  </StrictMode>,
);
