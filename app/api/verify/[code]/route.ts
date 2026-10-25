import { NextResponse } from 'next/server';
import { trustedClientIp } from '@/lib/net/client-ip';
import { verifyDocument } from '@/lib/verify/admin';

/**
 * GET /api/verify/{code} (action verify.go, docs/08): public, rate-limited per address, minimal projection —
 * title, holder company, membership number, status, valid to, superseded-by. Every lookup is counted.
 */
export const dynamic = 'force-dynamic';

export async function GET(req: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const r = await verifyDocument(decodeURIComponent(code), trustedClientIp(req.headers) ?? 'unknown');
  const headers = { 'Cache-Control': 'no-store' };
  if (r.kind === 'limited') return NextResponse.json({ error: 'too_many' }, { status: 429, headers });
  if (r.kind === 'invalid') return NextResponse.json({ error: 'invalid_code' }, { status: 400, headers });
  if (r.kind === 'none') return NextResponse.json({ found: false }, { status: 404, headers });
  return NextResponse.json({ found: true, document: r.doc }, { headers });
}
