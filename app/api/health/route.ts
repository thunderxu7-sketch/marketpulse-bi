import { getDatabase } from '@/db/bootstrap';
import { apiError, json } from '@/lib/http';

export async function GET() {
  try {
    const db = await getDatabase();
    const result = await db.prepare('SELECT COUNT(*) AS markets FROM markets').first<{ markets: number }>();
    return json({ status: 'ok', database: 'connected', markets: Number(result?.markets ?? 0), timestamp: new Date().toISOString() });
  } catch (error) {
    return apiError(error);
  }
}
