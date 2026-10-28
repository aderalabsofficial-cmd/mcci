import { NextResponse } from 'next/server';
import { PermissionError, requirePermission } from '@/lib/permissions/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/certificates/scan/{id}?v=original|stamped: a certificate scan for its review (migration 0450), shown
 * inline to certificate staff (temp ≥ 1, 2-step login). The scan row is read under the staff member's session (RLS),
 * the file with the service role.
 */
export const dynamic = 'force-dynamic';

const NO_STORE = { 'Cache-Control': 'no-store, private' };

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requirePermission('temp', 1);
  } catch (error) {
    if (error instanceof PermissionError) return NextResponse.json({ error: 'not_allowed' }, { status: 403, headers: NO_STORE });
    throw error;
  }
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/.test(id)) return NextResponse.json({ error: 'not_found' }, { status: 404, headers: NO_STORE });
  const supabase = await createClient();
  const { data: scan } = await supabase.from('certificate_scans').select('path, stamped_path').eq('id', id).maybeSingle();
  const stamped = new URL(req.url).searchParams.get('v') === 'stamped';
  const path = stamped ? scan?.stamped_path : scan?.path;
  if (!path) return NextResponse.json({ error: 'not_found' }, { status: 404, headers: NO_STORE });
  const { data: file } = await createAdminClient().storage.from('certificates').download(path);
  if (!file) return NextResponse.json({ error: 'not_found' }, { status: 404, headers: NO_STORE });
  return new NextResponse(await file.arrayBuffer(), {
    headers: {
      ...NO_STORE,
      'Content-Type': path.endsWith('.jpg') ? 'image/jpeg' : 'image/png',
      'Content-Disposition': 'inline',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
