import { getDatabase } from '@/db/bootstrap';
import { apiError, assertSameOrigin, json } from '@/lib/http';
import { z } from 'zod';

const paramsSchema = z.object({ id: z.coerce.number().int().positive() });
const bodySchema = z.object({ role: z.enum(['risk', 'operator', 'viewer']) });

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    assertSameOrigin(request);
    const { id } = paramsSchema.parse(await context.params);
    const { role } = bodySchema.parse(await request.json());
    const db = await getDatabase();
    const result = await db.prepare(
      `UPDATE team_members SET role = ? WHERE id = ? AND role != 'owner'`,
    ).bind(role, id).run();
    if (!result.meta.changes) return json({ error: 'Editable team member not found' }, { status: 404 });
    return json({ id, role });
  } catch (error) {
    return apiError(error);
  }
}
