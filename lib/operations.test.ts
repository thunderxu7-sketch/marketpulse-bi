import { describe, expect, it } from 'vitest';
import { buildOperationsData, defaultAutomationAgents, defaultTeamMembers } from './operations';
import type { Market } from './types';

const now = new Date('2026-09-02T08:00:00.000Z');
const markets: Market[] = [
  { id: 1, symbol: 'BTC', name: 'Bitcoin', chain: 'Bitcoin', price: 110_000, change24h: 1.2, totalDeposits: 100_000_000, totalBorrows: 60_000_000, utilization: 60, badDebt: 10_000, riskScore: 20, status: 'healthy', updatedAt: now.toISOString() },
  { id: 2, symbol: 'ETH', name: 'Ethereum', chain: 'Ethereum', price: 4_000, change24h: -0.4, totalDeposits: 90_000_000, totalBorrows: 65_000_000, utilization: 72.2, badDebt: 90_000, riskScore: 56, status: 'watch', updatedAt: now.toISOString() },
  { id: 3, symbol: 'USDT', name: 'Tether', chain: 'TRON', price: 1, change24h: 0, totalDeposits: 80_000_000, totalBorrows: 45_000_000, utilization: 56.25, badDebt: 2_000, riskScore: 15, status: 'healthy', updatedAt: now.toISOString() },
  { id: 4, symbol: 'USDC', name: 'USD Coin', chain: 'Ethereum', price: 1, change24h: 0, totalDeposits: 70_000_000, totalBorrows: 40_000_000, utilization: 57.14, badDebt: 3_000, riskScore: 16, status: 'healthy', updatedAt: now.toISOString() },
  { id: 5, symbol: 'TRX', name: 'TRON', chain: 'TRON', price: 0.34, change24h: 1.8, totalDeposits: 50_000_000, totalBorrows: 22_000_000, utilization: 44, badDebt: 1_500, riskScore: 14, status: 'healthy', updatedAt: now.toISOString() },
  { id: 6, symbol: 'wstETH', name: 'Wrapped stETH', chain: 'Ethereum', price: 5_000, change24h: -1.1, totalDeposits: 25_000_000, totalBorrows: 15_000_000, utilization: 60, badDebt: 220_000, riskScore: 78, status: 'critical', updatedAt: now.toISOString() },
];

describe('operational analytics payload', () => {
  it('builds every monitoring domain from the shared market state', () => {
    const data = buildOperationsData(markets, defaultAutomationAgents(now), defaultTeamMembers(now), now);

    expect(data.generatedAt).toBe(now.toISOString());
    expect(data.priceFeeds).toHaveLength(markets.length);
    expect(data.priceHistory).toHaveLength(24);
    expect(data.debtSegments).toHaveLength(4);
    expect(data.badDebtCases.length).toBeGreaterThan(4);
    expect(data.automationRuns).toHaveLength(12);
    expect(data.flowHistory).toHaveLength(30);
    expect(data.revenueHistory).toHaveLength(30);
    expect(data.liquidationHistory).toHaveLength(30);
    expect(data.teamMembers.some((member) => member.role === 'owner')).toBe(true);
  });

  it('keeps exposure and workflow values internally consistent', () => {
    const data = buildOperationsData(markets, defaultAutomationAgents(now), defaultTeamMembers(now), now);
    const totalDebt = data.debtSegments.reduce((sum, segment) => sum + segment.badDebt, 0);
    const totalProvisioned = data.debtSegments.reduce((sum, segment) => sum + segment.provisioned, 0);

    expect(totalDebt).toBeGreaterThan(totalProvisioned);
    expect(data.priceFeeds.find((feed) => feed.symbol === 'wstETH')?.status).toBe('critical');
    expect(data.transfers.every((transfer) => transfer.valueUsd > 0)).toBe(true);
    expect(data.liquidations.every((record) => record.rewardUsd < record.repaidUsd)).toBe(true);
  });
});
