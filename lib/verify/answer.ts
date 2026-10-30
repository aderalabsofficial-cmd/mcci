import 'server-only';
import { NextResponse } from 'next/server';
import type { VerifyResult } from '@/lib/verify/admin';

/** the JSON answer of the public verification API (app/api/public/verify, app/api/verify/[code]) */
function cors(req: Request): Record<string, string> {
  const origin = req.headers.get('origin');
  const allowed = (process.env.PUBLIC_API_ORIGINS ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  return origin && allowed.includes(origin) ? { 'Access-Control-Allow-Origin': origin, Vary: 'Origin' } : {};
}

export function answer(req: Request, r: VerifyResult): NextResponse {
  const headers = { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', ...cors(req) };
  if (r.kind === 'limited') return NextResponse.json({ error: 'too_many' }, { status: 429, headers });
  if (r.kind === 'invalid' || r.kind === 'tampered')
    return NextResponse.json({ error: r.kind }, { status: 400, headers });
  if (r.kind === 'none') return NextResponse.json({ found: false }, { status: 404, headers });
  return NextResponse.json({ found: true, result: r.v, signature: r.signature }, { headers });
}
