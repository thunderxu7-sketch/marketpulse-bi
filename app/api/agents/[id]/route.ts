import { getDatabase } from '@/db/bootstrap';
import { apiError, assertSameOrigin, json } from '@/lib/http';
import { z } from 'zod';

const paramsSchema = z.object({ id: z.coerce.number().int().positive() });
const bodySchema = z.object({ enabled: z.boolean() });

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    assertSameOrigin(request);
    const { id } = paramsSchema.parse(await context.params);
    const { enabled } = bodySchema.parse(await request.json());
    const db = await getDatabase();
    const now = new Date().toISOString();
    const nextStatus = enabled ? (id === 3 ? 'watch' : 'healthy') : 'paused';
    const result = await db.prepare(
      `UPDATE automation_agents SET enabled = ?, status = ?, updated_at = ? WHERE id = ?`,
    ).bind(enabled ? 1 : 0, nextStatus, now, id).run();
    if (!result.meta.changes) return json({ error: 'Automation agent not found' }, { status: 404 });
    return json({ id, enabled, status: nextStatus, updatedAt: now });
  } catch (error) {
    return apiError(error);
  }
}
