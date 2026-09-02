import { getDatabase } from '@/db/bootstrap';
import { apiError, json } from '@/lib/http';
import { buildOperationsData } from '@/lib/operations';
import { utilization } from '@/lib/risk';
import type { AutomationAgent, Market, TeamMember } from '@/lib/types';

type MarketRow = Omit<Market, 'utilization'>;
type AgentRow = Omit<AutomationAgent, 'enabled'> & { enabled: number };

export async function GET() {
  try {
    const db = await getDatabase();
    const [marketResult, agentResult, memberResult] = await Promise.all([
      db.prepare(
        `SELECT id, symbol, name, chain, price, change_24h AS change24h,
                total_deposits AS totalDeposits, total_borrows AS totalBorrows,
                bad_debt AS badDebt, risk_score AS riskScore, status, updated_at AS updatedAt
         FROM markets ORDER BY id`,
      ).all<MarketRow>(),
      db.prepare(
        `SELECT id, name, mission, scope, status, success_rate AS successRate,
                runs_24h AS runs24h, median_latency_ms AS medianLatencyMs,
                last_run_at AS lastRunAt, enabled, updated_at AS updatedAt
         FROM automation_agents ORDER BY id`,
      ).all<AgentRow>(),
      db.prepare(
        `SELECT id, name, email, role, status, last_active_at AS lastActiveAt,
                created_at AS createdAt FROM team_members ORDER BY id`,
      ).all<TeamMember>(),
    ]);

    const markets = marketResult.results.map((market) => ({
      ...market,
      utilization: utilization(market.totalBorrows, market.totalDeposits),
    }));
    const agents = agentResult.results.map((agent) => ({ ...agent, enabled: Boolean(agent.enabled) }));
    return json(buildOperationsData(markets, agents, memberResult.results));
  } catch (error) {
    return apiError(error);
  }
}
