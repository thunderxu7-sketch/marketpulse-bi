import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import ApiStatusView from '@/components/ApiStatusView';
import Dashboard from '@/components/Dashboard';
import EventsView from '@/components/EventsView';
import { I18nProvider } from '@/components/I18n';
import MarketsView from '@/components/MarketsView';
import RulesView from '@/components/RulesView';
import AutomationView from '@/components/operations/AutomationView';
import BadDebtView from '@/components/operations/BadDebtView';
import FundFlowsView from '@/components/operations/FundFlowsView';
import LiquidationsView from '@/components/operations/LiquidationsView';
import PriceFeedsView from '@/components/operations/PriceFeedsView';
import RevenueView from '@/components/operations/RevenueView';
import TeamAccessView from '@/components/operations/TeamAccessView';
import { usePathname } from 'next/navigation';
import '@/app/globals.css';
import { installLocalApi } from './mock-api';

installLocalApi();

function RouteView() {
  const pathname = usePathname();
  if (pathname === '/markets') return <MarketsView />;
  if (pathname === '/price-feeds') return <PriceFeedsView />;
  if (pathname === '/bad-debt') return <BadDebtView />;
  if (pathname === '/automation') return <AutomationView />;
  if (pathname === '/fund-flows') return <FundFlowsView />;
  if (pathname === '/revenue') return <RevenueView />;
  if (pathname === '/liquidations') return <LiquidationsView />;
  if (pathname === '/events') return <EventsView />;
  if (pathname === '/rules') return <RulesView />;
  if (pathname === '/team') return <TeamAccessView />;
  if (pathname === '/api-status') return <ApiStatusView />;
  return <Dashboard />;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <I18nProvider><RouteView /></I18nProvider>
  </StrictMode>,
);
