import { NextResponse } from 'next/server';
import { standaloneQr } from '@/lib/certificates/stamp';
import { signingConfigured } from '@/lib/qr/sign';
import { verifyUrl } from '@/lib/qr/svg';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/certificates/{code}/qr?format=png|svg[&download=1]: the certificate's QR on its own, large, black on white.
 * It encodes exactly the same signed verification link as the QR on the stamped copy (lib/qr/svg.ts verifyUrl), and
 * holds nothing else. Same access as the certificate itself: api.cert_file under the caller's session (certificate
 * staff; the member's company only once the QR copy is saved).
 */
export const dynamic = 'force-dynamic';

const NO_STORE = { 'Cache-Control': 'no-store, private', 'X-Content-Type-Options': 'nosniff' };

export async function GET(req: Request, { params }: { params: Promise<{ code: string }> }) {
  const code = decodeURIComponent((await params).code).toUpperCase();
  if (!/^MCCI-QR-[A-HJ-NP-Z2-9]{5}-[A-HJ-NP-Z2-9]{5}$/.test(code)) {
    return NextResponse.json({ error: 'invalid_code' }, { status: 400, headers: NO_STORE });
  }
  const supabase = await createClient();
  const { data, error } = await supabase.schema('api').rpc('cert_file', { p_code: code });
  if (error || !data?.[0]) return NextResponse.json({ error: 'not_found' }, { status: 404, headers: NO_STORE });
  if (!signingConfigured()) return NextResponse.json({ error: 'not_configured' }, { status: 503, headers: NO_STORE });
  const url = new URL(req.url);
  const format = url.searchParams.get('format') === 'svg' ? 'svg' : 'png';
  const body = await standaloneQr(verifyUrl(code), format);
  return new NextResponse(typeof body === 'string' ? body : new Uint8Array(body), {
    headers: {
      ...NO_STORE,
      'Content-Type': format === 'svg' ? 'image/svg+xml' : 'image/png',
      'Content-Disposition':
        url.searchParams.get('download') === '1' ? `attachment; filename="${code}.${format}"` : 'inline',
    },
  });
}
