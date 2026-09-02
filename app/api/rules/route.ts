import { getDatabase } from '@/db/bootstrap';
import { apiError, json } from '@/lib/http';
import type { AlertRule } from '@/lib/types';

export async function GET() {
  try {
    const db = await getDatabase();
    const result = await db.prepare(
      `SELECT id, name, metric, operator, threshold, unit, severity,
              enabled, updated_at AS updatedAt
       FROM alert_rules ORDER BY id ASC`,
    ).all<Omit<AlertRule, 'enabled'> & { enabled: number }>();
    return json({ rules: result.results.map((rule) => ({ ...rule, enabled: Boolean(rule.enabled) })) });
  } catch (error) {
    return apiError(error);
  }
}
