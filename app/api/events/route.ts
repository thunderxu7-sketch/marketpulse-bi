import { getDatabase } from '@/db/bootstrap';
import { apiError, json } from '@/lib/http';
import type { RiskEvent } from '@/lib/types';
import { z } from 'zod';

const querySchema = z.object({
  status: z.enum(['all', 'open', 'acknowledged']).default('all'),
  severity: z.enum(['all', 'info', 'warning', 'critical']).default('all'),
});

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const query = querySchema.parse({
      status: url.searchParams.get('status') ?? undefined,
      severity: url.searchParams.get('severity') ?? undefined,
    });
    const db = await getDatabase();
    const clauses: string[] = [];
    const values: unknown[] = [];
    if (query.status !== 'all') { clauses.push('e.status = ?'); values.push(query.status); }
    if (query.severity !== 'all') { clauses.push('e.severity = ?'); values.push(query.severity); }
    const result = await db.prepare(
      `SELECT e.id, e.market_id AS marketId, m.symbol, e.event_type AS eventType,
              e.severity, e.title, e.detail, e.status, e.occurred_at AS occurredAt,
              e.acknowledged_at AS acknowledgedAt
       FROM risk_events e LEFT JOIN markets m ON m.id = e.market_id
       ${clauses.length ? `WHERE ${clauses.join(' AND ')}` : ''}
       ORDER BY e.occurred_at DESC LIMIT 100`,
    ).bind(...values).all<RiskEvent>();
    return json({ events: result.results, filters: query });
  } catch (error) {
    return apiError(error);
  }
}
