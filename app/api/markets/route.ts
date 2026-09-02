import { getDatabase } from '@/db/bootstrap';
import { apiError, json } from '@/lib/http';
import { utilization } from '@/lib/risk';
import type { Market } from '@/lib/types';
import { z } from 'zod';

const querySchema = z.object({
  status: z.enum(['all', 'healthy', 'watch', 'critical']).default('all'),
  search: z.string().trim().max(30).default(''),
  sort: z.enum(['risk', 'utilization', 'deposits']).default('risk'),
});

type MarketRow = Omit<Market, 'utilization'>;

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const query = querySchema.parse({
      status: url.searchParams.get('status') ?? undefined,
      search: url.searchParams.get('search') ?? undefined,
      sort: url.searchParams.get('sort') ?? undefined,
    });
    const db = await getDatabase();
    const clauses: string[] = [];
    const values: unknown[] = [];
    if (query.status !== 'all') {
      clauses.push('status = ?');
      values.push(query.status);
    }
    if (query.search) {
      clauses.push('(symbol LIKE ? OR name LIKE ? OR chain LIKE ?)');
      const pattern = `%${query.search}%`;
      values.push(pattern, pattern, pattern);
    }
    const order = query.sort === 'deposits'
      ? 'total_deposits DESC'
      : query.sort === 'utilization'
        ? '(total_borrows / NULLIF(total_deposits, 0)) DESC'
        : 'risk_score DESC';
    const statement = db.prepare(
      `SELECT id, symbol, name, chain, price, change_24h AS change24h,
              total_deposits AS totalDeposits, total_borrows AS totalBorrows,
              bad_debt AS badDebt, risk_score AS riskScore, status, updated_at AS updatedAt
       FROM markets ${clauses.length ? `WHERE ${clauses.join(' AND ')}` : ''}
       ORDER BY ${order}`,
    ).bind(...values);
    const result = await statement.all<MarketRow>();
    return json({
      markets: result.results.map((market) => ({
        ...market,
        utilization: utilization(market.totalBorrows, market.totalDeposits),
      })),
      filters: query,
    });
  } catch (error) {
    return apiError(error);
  }
}
