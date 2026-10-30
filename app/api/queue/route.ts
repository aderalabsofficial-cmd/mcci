import { NextResponse } from 'next/server';
import { getSession } from '@/lib/permissions/server';
import { loadQueue } from '@/lib/queue/load';

/**
 * GET /api/queue — "My queue" as JSON for the Android app (docs/15 MA): the signed-in staff member's waiting work,
 * within their own limits (RLS). Staff with the 2-step login only; never cached.
 */
export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getSession();
  const headers = { 'Cache-Control': 'no-store, private' };
  if (!session) return NextResponse.json({ error: 'not_signed_in' }, { status: 401, headers });
  if (!session.access.staff || session.aal !== 'aal2')
    return NextResponse.json({ error: 'not_allowed' }, { status: 403, headers });
  const groups = await loadQueue(session);
  return NextResponse.json({ at: new Date().toISOString(), groups }, { headers });
}
