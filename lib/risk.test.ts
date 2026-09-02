import { describe, expect, it } from 'vitest';
import { clamp, healthScore, statusForRiskScore, utilization } from './risk';

describe('risk calculations', () => {
  it('calculates utilization as a percentage', () => {
    expect(utilization(60, 100)).toBe(60);
    expect(utilization(50, 0)).toBe(0);
  });

  it('classifies risk boundaries', () => {
    expect(statusForRiskScore(20)).toBe('healthy');
    expect(statusForRiskScore(45)).toBe('watch');
    expect(statusForRiskScore(70)).toBe('critical');
  });

  it('derives a bounded portfolio health score', () => {
    expect(healthScore([])).toBe(100);
    expect(healthScore([10, 20, 30])).toBe(88);
    expect(healthScore([1000])).toBe(0);
  });

  it('clamps out-of-range values', () => {
    expect(clamp(-1, 0, 100)).toBe(0);
    expect(clamp(101, 0, 100)).toBe(100);
  });
});
