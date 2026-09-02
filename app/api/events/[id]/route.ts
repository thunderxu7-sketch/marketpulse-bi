import { getDatabase } from '@/db/bootstrap';
import { apiError, assertSameOrigin, json } from '@/lib/http';
import { z } from 'zod';

const paramsSchema = z.object({ id: z.coerce.number().int().positive() });
const bodySchema = z.object({ status: z.literal('acknowledged') });

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    assertSameOrigin(request);
    const { id } = paramsSchema.parse(await context.params);
    bodySchema.parse(await request.json());
    const db = await getDatabase();
    const now = new Date().toISOString();
    const result = await db.prepare(
      `UPDATE risk_events SET status = 'acknowledged', acknowledged_at = ?
       WHERE id = ? AND status = 'open'`,
    ).bind(now, id).run();
    if (!result.meta.changes) return json({ error: 'Open event not found' }, { status: 404 });
    return json({ id, status: 'acknowledged', acknowledgedAt: now });
  } catch (error) {
    return apiError(error);
  }
}
