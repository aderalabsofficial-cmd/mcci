import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/certificates/{code}: the QR-stamped scan of a membership certificate (migration 0450), shown inline.
 * Only the member's own company (docs ≥ 1) or certificate staff (temp ≥ 1): api.cert_file checks it under the
 * caller's session; the file is then read with the service role (scans are never readable from storage directly).
 */
export const dynamic = 'force-dynamic';

const NO_STORE = { 'Cache-Control': 'no-store, private' };

export async function GET(_req: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  if (!/^MCCI-QR-[A-HJ-NP-Z2-9]{5}-[A-HJ-NP-Z2-9]{5}$/.test(decodeURIComponent(code).toUpperCase())) {
    return NextResponse.json({ error: 'invalid_code' }, { status: 400, headers: NO_STORE });
  }
  const supabase = await createClient();
  const { data, error } = await supabase.schema('api').rpc('cert_file', { p_code: decodeURIComponent(code) });
  const row = data?.[0];
  if (error || !row?.path) return NextResponse.json({ error: 'not_found' }, { status: 404, headers: NO_STORE });
  const { data: file } = await createAdminClient().storage.from('certificates').download(row.path);
  if (!file) return NextResponse.json({ error: 'not_found' }, { status: 404, headers: NO_STORE });
  return new NextResponse(await file.arrayBuffer(), {
    headers: {
      ...NO_STORE,
      'Content-Type': row.path.endsWith('.jpg') ? 'image/jpeg' : 'image/png',
      'Content-Disposition': `inline; filename="${row.member_no ?? 'certificate'}.png"`,
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
