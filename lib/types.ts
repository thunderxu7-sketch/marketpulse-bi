export type MarketStatus = 'healthy' | 'watch' | 'critical';
export type Severity = 'info' | 'warning' | 'critical';
export type EventStatus = 'open' | 'acknowledged';

export interface Market {
  id: number;
  symbol: string;
  name: string;
  chain: string;
  price: number;
  change24h: number;
  totalDeposits: number;
  totalBorrows: number;
  utilization: number;
  badDebt: number;
  riskScore: number;
  status: MarketStatus;
  updatedAt: string;
}

export interface RiskEvent {
  id: number;
  marketId: number | null;
  symbol: string | null;
  eventType: string;
  severity: Severity;
  title: string;
  detail: string;
  status: EventStatus;
  occurredAt: string;
  acknowledgedAt: string | null;
}

export interface AlertRule {
  id: number;
  name: string;
  metric: string;
  operator: 'gt' | 'gte' | 'lt' | 'lte';
  threshold: number;
  unit: string;
  severity: Severity;
  enabled: boolean;
  updatedAt: string;
}

export interface Snapshot {
  capturedAt: string;
  totalDeposits: number;
  totalBorrows: number;
  revenue: number;
  healthScore: number;
}

export interface DashboardData {
  generatedAt: string;
  summary: {
    totalDeposits: number;
    totalBorrows: number;
    utilization: number;
    openEvents: number;
    criticalEvents: number;
    badDebtRatio: number;
    healthScore: number;
    revenue24h: number;
  };
  markets: Market[];
  events: RiskEvent[];
  snapshots: Snapshot[];
  revenueMix: Array<{ name: string; value: number }>;
}
