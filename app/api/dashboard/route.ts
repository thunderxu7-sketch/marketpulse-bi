import { getDatabase } from '@/db/bootstrap';
import { healthScore, utilization } from '@/lib/risk';
import type { DashboardData, Market, RiskEvent, Snapshot } from '@/lib/types';
import { apiError, json } from '@/lib/http';

type MarketRow = Omit<Market, 'utilization'>;

export async function GET() {
  try {
    const db = await getDatabase();
    const [marketResult, eventResult, snapshotResult, eventCounts] = await Promise.all([
      db.prepare(
        `SELECT id, symbol, name, chain, price, change_24h AS change24h,
                total_deposits AS totalDeposits, total_borrows AS totalBorrows,
                bad_debt AS badDebt, risk_score AS riskScore, status, updated_at AS updatedAt
         FROM markets ORDER BY risk_score DESC`,
      ).all<MarketRow>(),
      db.prepare(
        `SELECT e.id, e.market_id AS marketId, m.symbol, e.event_type AS eventType,
                e.severity, e.title, e.detail, e.status, e.occurred_at AS occurredAt,
                e.acknowledged_at AS acknowledgedAt
         FROM risk_events e LEFT JOIN markets m ON m.id = e.market_id
         ORDER BY e.occurred_at DESC LIMIT 7`,
      ).all<RiskEvent>(),
      db.prepare(
        `SELECT capturedAt, totalDeposits, totalBorrows, revenue, healthScore
         FROM (
           SELECT captured_at AS capturedAt, total_deposits AS totalDeposits,
                  total_borrows AS totalBorrows, revenue, health_score AS healthScore
           FROM portfolio_snapshots ORDER BY captured_at DESC LIMIT 60
         ) ORDER BY capturedAt ASC`,
      ).all<Snapshot>(),
      db.prepare(
        `SELECT COUNT(*) AS openEvents,
                SUM(CASE WHEN severity = 'critical' THEN 1 ELSE 0 END) AS criticalEvents
         FROM risk_events WHERE status = 'open'`,
      ).first<{ openEvents: number; criticalEvents: number }>(),
    ]);

    const markets: Market[] = marketResult.results.map((market) => ({
      ...market,
      utilization: utilization(market.totalBorrows, market.totalDeposits),
    }));
    const totalDeposits = markets.reduce((total, market) => total + market.totalDeposits, 0);
    const totalBorrows = markets.reduce((total, market) => total + market.totalBorrows, 0);
    const totalBadDebt = markets.reduce((total, market) => total + market.badDebt, 0);
    const latestSnapshot = snapshotResult.results.at(-1);
    const revenue24h = latestSnapshot?.revenue ?? 0;

    const payload: DashboardData = {
      generatedAt: new Date().toISOString(),
      summary: {
        totalDeposits,
        totalBorrows,
        utilization: utilization(totalBorrows, totalDeposits),
        openEvents: Number(eventCounts?.openEvents ?? 0),
        criticalEvents: Number(eventCounts?.criticalEvents ?? 0),
        badDebtRatio: utilization(totalBadDebt, totalBorrows),
        healthScore: healthScore(markets.map((market) => market.riskScore)),
        revenue24h,
      },
      markets,
      events: eventResult.results,
      snapshots: snapshotResult.results,
      revenueMix: [
        { name: 'Lending markets', value: Math.round(revenue24h * 0.54) },
        { name: 'Energy services', value: Math.round(revenue24h * 0.29) },
        { name: 'Staking', value: Math.round(revenue24h * 0.17) },
      ],
    };

    return json(payload);
  } catch (error) {
    return apiError(error);
  }
}
