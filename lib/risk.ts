import type { MarketStatus } from './types';

export function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function utilization(totalBorrows: number, totalDeposits: number) {
  if (!Number.isFinite(totalDeposits) || totalDeposits <= 0) return 0;
  return clamp((totalBorrows / totalDeposits) * 100, 0, 999);
}

export function statusForRiskScore(score: number): MarketStatus {
  if (score >= 70) return 'critical';
  if (score >= 45) return 'watch';
  return 'healthy';
}

export function healthScore(riskScores: number[]) {
  if (!riskScores.length) return 100;
  const averageRisk = riskScores.reduce((total, score) => total + score, 0) / riskScores.length;
  return Math.round(clamp(100 - averageRisk * 0.58, 0, 100));
}
