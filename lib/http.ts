import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

export function json(data: unknown, init?: ResponseInit) {
  return NextResponse.json(data, {
    ...init,
    headers: {
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
      ...init?.headers,
    },
  });
}

export function apiError(error: unknown) {
  if (error instanceof Response) return error;
  if (error instanceof ZodError) {
    return json({ error: 'Invalid request', issues: error.issues }, { status: 400 });
  }
  console.error(error);
  return json({ error: 'Unable to complete request' }, { status: 500 });
}

export function assertSameOrigin(request: Request) {
  const origin = request.headers.get('origin');
  if (!origin) return;
  if (new URL(request.url).origin !== origin) throw new Response('Forbidden', { status: 403 });
}
