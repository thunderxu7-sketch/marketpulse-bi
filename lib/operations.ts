import type {
  AutomationAgent,
  AutomationRun,
  BadDebtCase,
  DebtSegment,
  FlowPoint,
  FundTransfer,
  LiquidationPoint,
  LiquidationRecord,
  Market,
  OperationsData,
  PriceFeed,
  RevenuePoint,
  RevenueProduct,
  TeamMember,
} from './types';

const HOUR = 3_600_000;
const DAY = 24 * HOUR;

function isoAt(base: Date, offsetMs: number) {
  return new Date(base.getTime() + offsetMs).toISOString();
}

function shortAddress(index: number) {
  const heads = ['0x8A71', '0x41C8', '0x9F22', '0x7B03', '0xD118', '0x2CE5'];
  const tails = ['92F4', '10BC', 'E761', 'A80D', '4CC2', 'F31A'];
  return `${heads[index % heads.length]}…${tails[(index * 3 + 1) % tails.length]}`;
}

export function defaultAutomationAgents(now = new Date()): AutomationAgent[] {
  const updatedAt = now.toISOString();
  return [
    { id: 1, name: 'Oracle Sentinel', mission: 'Cross-source price validation', scope: '6 markets · 14 feeds', status: 'healthy', successRate: 99.98, runs24h: 8640, medianLatencyMs: 382, lastRunAt: isoAt(now, -42_000), enabled: true, updatedAt },
    { id: 2, name: 'Liquidation Keeper', mission: 'Position health and execution', scope: '3 networks · 4 queues', status: 'healthy', successRate: 99.74, runs24h: 1824, medianLatencyMs: 928, lastRunAt: isoAt(now, -81_000), enabled: true, updatedAt },
    { id: 3, name: 'Liquidity Rebalancer', mission: 'Reserve and buffer balancing', scope: '9 liquidity routes', status: 'watch', successRate: 97.42, runs24h: 288, medianLatencyMs: 1680, lastRunAt: isoAt(now, -246_000), enabled: true, updatedAt },
    { id: 4, name: 'Revenue Collector', mission: 'Accrual settlement and accounting', scope: '12 revenue streams', status: 'healthy', successRate: 100, runs24h: 96, medianLatencyMs: 742, lastRunAt: isoAt(now, -512_000), enabled: true, updatedAt },
    { id: 5, name: 'Exposure Guard', mission: 'Concentration and limit enforcement', scope: '18 policy constraints', status: 'healthy', successRate: 99.91, runs24h: 4320, medianLatencyMs: 214, lastRunAt: isoAt(now, -64_000), enabled: true, updatedAt },
  ];
}

export function defaultTeamMembers(now = new Date()): TeamMember[] {
  return [
    { id: 1, name: 'Platform Owner', email: 'owner@marketpulse.demo', role: 'owner', status: 'active', lastActiveAt: isoAt(now, -8 * 60_000), createdAt: isoAt(now, -420 * DAY) },
    { id: 2, name: 'Risk Lead', email: 'risk@marketpulse.demo', role: 'risk', status: 'active', lastActiveAt: isoAt(now, -34 * 60_000), createdAt: isoAt(now, -306 * DAY) },
    { id: 3, name: 'Operations Desk', email: 'ops@marketpulse.demo', role: 'operator', status: 'active', lastActiveAt: isoAt(now, -2.4 * HOUR), createdAt: isoAt(now, -208 * DAY) },
    { id: 4, name: 'Finance Viewer', email: 'finance@marketpulse.demo', role: 'viewer', status: 'active', lastActiveAt: isoAt(now, -26 * HOUR), createdAt: isoAt(now, -118 * DAY) },
    { id: 5, name: 'Audit Observer', email: 'audit@marketpulse.demo', role: 'viewer', status: 'invited', lastActiveAt: isoAt(now, -74 * HOUR), createdAt: isoAt(now, -3 * DAY) },
  ];
}

function buildPriceFeeds(markets: Market[], now: Date): PriceFeed[] {
  const sources = [
    ['Pyth Network', 'Chainlink'],
    ['Chainlink', 'RedStone'],
    ['TRON Oracle', 'Binance Index'],
    ['Chainlink', 'Coinbase Index'],
    ['TRON Oracle', 'Pyth Network'],
    ['RedStone', 'Chainlink'],
  ];
  const deviations = [4.2, 18.6, 1.1, 2.4, 7.8, 34.5];
  const latencies = [12, 19, 8, 14, 11, 46];
  return markets.map((market, index) => {
    const deviationBps = deviations[index] ?? 5;
    const status = deviationBps >= 30 ? 'critical' : deviationBps >= 15 ? 'watch' : 'healthy';
    return {
      id: market.id,
      symbol: market.symbol,
      chain: market.chain,
      primarySource: sources[index]?.[0] ?? 'Composite Index',
      fallbackSource: sources[index]?.[1] ?? 'Fallback Index',
      referencePrice: market.price,
      reportedPrice: market.price * (1 + deviationBps / 10_000),
      deviationBps,
      heartbeatSeconds: index === 5 ? 60 : index > 1 ? 30 : 15,
      latencySeconds: latencies[index] ?? 10,
      confidence: Math.max(92, 100 - deviationBps / 4),
      status,
      updatedAt: isoAt(now, -(latencies[index] ?? 10) * 1000),
    };
  });
}

function buildPriceHistory(now: Date): OperationsData['priceHistory'] {
  return Array.from({ length: 24 }, (_, index) => {
    const phase = index / 3;
    return {
      time: isoAt(now, -(23 - index) * HOUR),
      BTC: 3.2 + Math.abs(Math.sin(phase)) * 5.8,
      ETH: 8.4 + Math.abs(Math.cos(phase * 0.8)) * 12.5,
      USDT: 0.8 + Math.abs(Math.sin(phase * 1.3)) * 2.1,
      USDC: 1.2 + Math.abs(Math.cos(phase * 1.2)) * 2.5,
      TRX: 4.5 + Math.abs(Math.sin(phase * 0.7)) * 6.6,
      wstETH: 18 + Math.abs(Math.sin(phase * 0.55)) * 22,
    };
  });
}

function buildDebtData(markets: Market[]): { segments: DebtSegment[]; cases: BadDebtCase[] } {
  const badDebt = Math.max(401_500, markets.reduce((sum, market) => sum + market.badDebt, 0));
  const segments: DebtSegment[] = [
    { id: 'v3-ethereum', network: 'Ethereum', version: 'V3', totalBorrows: 126_400_000, badDebt: badDebt * 0.43, provisioned: badDebt * 0.34, recoverable: badDebt * 0.31, affectedAccounts: 18, delta24h: 2.8 },
    { id: 'v2-tron', network: 'TRON', version: 'V2', totalBorrows: 88_000_000, badDebt: badDebt * 0.19, provisioned: badDebt * 0.17, recoverable: badDebt * 0.14, affectedAccounts: 9, delta24h: -1.6 },
    { id: 'v2-ethereum', network: 'Ethereum', version: 'V2', totalBorrows: 74_600_000, badDebt: badDebt * 0.25, provisioned: badDebt * 0.22, recoverable: badDebt * 0.18, affectedAccounts: 14, delta24h: 0.9 },
    { id: 'legacy', network: 'Multi-chain', version: 'Legacy', totalBorrows: 12_800_000, badDebt: badDebt * 0.13, provisioned: badDebt * 0.11, recoverable: badDebt * 0.08, affectedAccounts: 27, delta24h: -4.2 },
  ];
  const cases: BadDebtCase[] = [
    { id: 'BD-2481', market: 'wstETH', network: 'Ethereum', version: 'V3', amount: 82_460, cause: 'volatility', healthFactor: 0.82, ageHours: 3, recoverable: 71_800, status: 'recovering' },
    { id: 'BD-2478', market: 'ETH', network: 'Ethereum', version: 'V3', amount: 61_280, cause: 'liquidity', healthFactor: 0.88, ageHours: 7, recoverable: 44_900, status: 'investigating' },
    { id: 'BD-2466', market: 'USDT', network: 'TRON', version: 'V2', amount: 38_900, cause: 'execution', healthFactor: 0.91, ageHours: 19, recoverable: 33_100, status: 'recovering' },
    { id: 'BD-2459', market: 'BTC', network: 'Bitcoin', version: 'V2', amount: 27_480, cause: 'oracle-gap', healthFactor: 0.86, ageHours: 31, recoverable: 21_500, status: 'contained' },
    { id: 'BD-2442', market: 'USDC', network: 'Ethereum', version: 'V2', amount: 18_760, cause: 'liquidity', healthFactor: 0.93, ageHours: 52, recoverable: 16_800, status: 'contained' },
    { id: 'BD-2417', market: 'TRX', network: 'TRON', version: 'Legacy', amount: 14_320, cause: 'execution', healthFactor: 0.79, ageHours: 83, recoverable: 9_700, status: 'recovering' },
  ];
  return { segments, cases };
}

function buildAutomationRuns(agents: AutomationAgent[], now: Date): AutomationRun[] {
  const tasks = ['Validate composite price', 'Scan unhealthy positions', 'Rebalance reserve buffer', 'Settle protocol accrual', 'Evaluate concentration limit'];
  const markets = ['BTC', 'wstETH', 'USDT', 'Portfolio', 'ETH', 'TRX', 'USDC', 'Portfolio'];
  return Array.from({ length: 12 }, (_, index) => {
    const agent = agents[index % agents.length];
    const result = index === 7 ? 'failed' : index === 2 || index === 9 ? 'warning' : 'success';
    return {
      id: `RUN-${8240 - index}`,
      agentId: agent.id,
      agentName: agent.name,
      task: tasks[index % tasks.length],
      market: markets[index % markets.length],
      durationMs: 240 + ((index * 317) % 2100),
      result,
      startedAt: isoAt(now, -(index * 17 + 3) * 60_000),
    };
  });
}

function buildFlowHistory(now: Date): FlowPoint[] {
  return Array.from({ length: 30 }, (_, index) => ({
    date: isoAt(now, -(29 - index) * DAY),
    deposits: 13_800_000 + index * 120_000 + Math.sin(index / 2.1) * 3_400_000,
    withdrawals: 8_900_000 + index * 74_000 + Math.cos(index / 2.7) * 2_500_000,
    borrows: 7_600_000 + index * 95_000 + Math.sin(index / 1.8) * 2_100_000,
    repayments: 6_800_000 + index * 63_000 + Math.cos(index / 2.3) * 1_700_000,
  }));
}

function buildTransfers(now: Date): FundTransfer[] {
  const assets = ['USDT', 'ETH', 'USDC', 'BTC', 'TRX', 'wstETH', 'USDT', 'ETH', 'USDC', 'TRX', 'BTC', 'USDT'];
  const networks = ['TRON', 'Ethereum', 'Ethereum', 'Bitcoin', 'TRON', 'Ethereum', 'TRON', 'Ethereum', 'Ethereum', 'TRON', 'Bitcoin', 'TRON'];
  const prices: Record<string, number> = { USDT: 1, ETH: 4328, USDC: 1, BTC: 111820, TRX: 0.34, wstETH: 5285 };
  const actions: FundTransfer['action'][] = ['deposit', 'withdrawal', 'repayment', 'borrow', 'deposit', 'withdrawal', 'borrow', 'repayment', 'deposit', 'repayment', 'withdrawal', 'deposit'];
  return assets.map((asset, index) => {
    const valueUsd = 240_000 + ((index * 713_000) % 4_600_000);
    const action = actions[index];
    return {
      id: `TX-${98240 - index}`,
      direction: action === 'deposit' || action === 'repayment' ? 'inflow' : 'outflow',
      action,
      asset,
      network: networks[index],
      account: shortAddress(index),
      amount: valueUsd / prices[asset],
      valueUsd,
      riskLevel: valueUsd > 3_700_000 ? 'high' : valueUsd > 2_000_000 ? 'review' : 'normal',
      occurredAt: isoAt(now, -(index * 29 + 4) * 60_000),
    };
  });
}

function buildRevenueHistory(now: Date): RevenuePoint[] {
  return Array.from({ length: 30 }, (_, index) => ({
    date: isoAt(now, -(29 - index) * DAY),
    lending: 62_000 + index * 780 + Math.sin(index / 2.3) * 8_400,
    liquidation: 18_000 + Math.abs(Math.cos(index / 1.7)) * 15_000,
    automation: 24_000 + index * 240 + Math.sin(index / 3.1) * 3_800,
    treasury: 11_500 + Math.cos(index / 2.8) * 2_300,
  }));
}

function buildRevenueProducts(history: RevenuePoint[]): RevenueProduct[] {
  const total30d = history.reduce((sum, item) => sum + item.lending + item.liquidation + item.automation + item.treasury, 0);
  return [
    { id: 'lending-v3', name: 'Lending V3', network: 'Ethereum', revenue7d: 528_400, revenue30d: 2_084_000, cumulativeRevenue: 28_640_000, margin: 81.4, share: 41.8, change: 8.6 },
    { id: 'lending-v2', name: 'Lending V2', network: 'TRON', revenue7d: 312_800, revenue30d: 1_284_000, cumulativeRevenue: 21_920_000, margin: 77.2, share: 25.7, change: 3.2 },
    { id: 'automation', name: 'Automation services', network: 'Multi-chain', revenue7d: 196_700, revenue30d: 786_000, cumulativeRevenue: 7_860_000, margin: 89.6, share: 15.7, change: 12.4 },
    { id: 'liquidations', name: 'Liquidation fees', network: 'Multi-chain', revenue7d: 142_900, revenue30d: 564_000, cumulativeRevenue: 5_420_000, margin: 68.3, share: 11.3, change: -2.7 },
    { id: 'treasury', name: 'Treasury yield', network: 'Multi-chain', revenue7d: 68_200, revenue30d: Math.max(275_000, total30d * 0.055), cumulativeRevenue: 3_180_000, margin: 93.1, share: 5.5, change: 1.8 },
  ];
}

function buildLiquidationHistory(now: Date): LiquidationPoint[] {
  return Array.from({ length: 30 }, (_, index) => ({
    date: isoAt(now, -(29 - index) * DAY),
    repaid: 820_000 + Math.abs(Math.sin(index / 2.2)) * 1_480_000 + index * 18_000,
    reward: 41_000 + Math.abs(Math.cos(index / 2.4)) * 86_000,
    events: 18 + Math.round(Math.abs(Math.sin(index / 2.8)) * 34),
  }));
}

function buildLiquidations(now: Date): LiquidationRecord[] {
  const markets = ['wstETH', 'ETH', 'BTC', 'USDT', 'TRX', 'USDC', 'wstETH', 'ETH', 'BTC', 'TRX'];
  const networks = ['Ethereum', 'Ethereum', 'Bitcoin', 'TRON', 'TRON', 'Ethereum', 'Ethereum', 'Ethereum', 'Bitcoin', 'TRON'];
  const collateral = ['wstETH', 'wstETH', 'BTC', 'TRX', 'BTC', 'ETH', 'ETH', 'BTC', 'wstETH', 'USDT'];
  const debts = ['USDC', 'USDT', 'USDC', 'USDT', 'USDT', 'USDC', 'USDT', 'USDC', 'USDT', 'USDC'];
  return markets.map((market, index) => {
    const repaidUsd = 84_000 + ((index * 193_700) % 1_420_000);
    return {
      id: `LQ-${6842 - index}`,
      network: networks[index],
      version: index % 4 === 0 ? 'V2' : 'V3',
      market,
      borrower: shortAddress(index + 3),
      debtAsset: debts[index],
      collateralAsset: collateral[index],
      repaidUsd,
      rewardUsd: repaidUsd * (0.045 + (index % 3) * 0.005),
      route: index % 6 === 0 ? 'backstop' : index % 4 === 0 ? 'auction' : 'direct',
      status: index === 1 ? 'pending' : index === 6 ? 'review' : 'settled',
      occurredAt: isoAt(now, -(index * 41 + 7) * 60_000),
    };
  });
}

export function buildOperationsData(
  markets: Market[],
  automationAgents: AutomationAgent[],
  teamMembers: TeamMember[],
  now = new Date(),
): OperationsData {
  const debt = buildDebtData(markets);
  const revenueHistory = buildRevenueHistory(now);
  return {
    generatedAt: now.toISOString(),
    priceFeeds: buildPriceFeeds(markets, now),
    priceHistory: buildPriceHistory(now),
    debtSegments: debt.segments,
    badDebtCases: debt.cases,
    automationAgents,
    automationRuns: buildAutomationRuns(automationAgents, now),
    flowHistory: buildFlowHistory(now),
    transfers: buildTransfers(now),
    revenueHistory,
    revenueProducts: buildRevenueProducts(revenueHistory),
    liquidationHistory: buildLiquidationHistory(now),
    liquidations: buildLiquidations(now),
    teamMembers,
  };
}
