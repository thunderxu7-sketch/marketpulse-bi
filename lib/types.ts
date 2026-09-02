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

export type OperationalStatus = 'healthy' | 'watch' | 'critical' | 'paused';

export interface PriceFeed {
  id: number;
  symbol: string;
  chain: string;
  primarySource: string;
  fallbackSource: string;
  referencePrice: number;
  reportedPrice: number;
  deviationBps: number;
  heartbeatSeconds: number;
  latencySeconds: number;
  confidence: number;
  status: Exclude<OperationalStatus, 'paused'>;
  updatedAt: string;
}

export interface DebtSegment {
  id: string;
  network: string;
  version: string;
  totalBorrows: number;
  badDebt: number;
  provisioned: number;
  recoverable: number;
  affectedAccounts: number;
  delta24h: number;
}

export interface BadDebtCase {
  id: string;
  market: string;
  network: string;
  version: string;
  amount: number;
  cause: 'oracle-gap' | 'liquidity' | 'volatility' | 'execution';
  healthFactor: number;
  ageHours: number;
  recoverable: number;
  status: 'investigating' | 'recovering' | 'contained';
}

export interface AutomationAgent {
  id: number;
  name: string;
  mission: string;
  scope: string;
  status: OperationalStatus;
  successRate: number;
  runs24h: number;
  medianLatencyMs: number;
  lastRunAt: string;
  enabled: boolean;
  updatedAt: string;
}

export interface AutomationRun {
  id: string;
  agentId: number;
  agentName: string;
  task: string;
  market: string;
  durationMs: number;
  result: 'success' | 'warning' | 'failed';
  startedAt: string;
}

export interface FlowPoint {
  date: string;
  deposits: number;
  withdrawals: number;
  borrows: number;
  repayments: number;
}

export interface FundTransfer {
  id: string;
  direction: 'inflow' | 'outflow';
  action: 'deposit' | 'withdrawal' | 'borrow' | 'repayment';
  asset: string;
  network: string;
  account: string;
  amount: number;
  valueUsd: number;
  riskLevel: 'normal' | 'review' | 'high';
  occurredAt: string;
}

export interface RevenuePoint {
  date: string;
  lending: number;
  liquidation: number;
  automation: number;
  treasury: number;
}

export interface RevenueProduct {
  id: string;
  name: string;
  network: string;
  revenue7d: number;
  revenue30d: number;
  cumulativeRevenue: number;
  margin: number;
  share: number;
  change: number;
}

export interface LiquidationPoint {
  date: string;
  repaid: number;
  reward: number;
  events: number;
}

export interface LiquidationRecord {
  id: string;
  network: string;
  version: string;
  market: string;
  borrower: string;
  debtAsset: string;
  collateralAsset: string;
  repaidUsd: number;
  rewardUsd: number;
  route: 'direct' | 'auction' | 'backstop';
  status: 'settled' | 'pending' | 'review';
  occurredAt: string;
}

export type TeamRole = 'owner' | 'risk' | 'operator' | 'viewer';

export interface TeamMember {
  id: number;
  name: string;
  email: string;
  role: TeamRole;
  status: 'active' | 'invited';
  lastActiveAt: string;
  createdAt: string;
}

export interface OperationsData {
  generatedAt: string;
  priceFeeds: PriceFeed[];
  priceHistory: Array<{ time: string; BTC: number; ETH: number; USDT: number; USDC: number; TRX: number; wstETH: number }>;
  debtSegments: DebtSegment[];
  badDebtCases: BadDebtCase[];
  automationAgents: AutomationAgent[];
  automationRuns: AutomationRun[];
  flowHistory: FlowPoint[];
  transfers: FundTransfer[];
  revenueHistory: RevenuePoint[];
  revenueProducts: RevenueProduct[];
  liquidationHistory: LiquidationPoint[];
  liquidations: LiquidationRecord[];
  teamMembers: TeamMember[];
}
