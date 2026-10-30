import { trustedClientIp } from '@/lib/net/client-ip';
import { verifyByMember, verifyByReference } from '@/lib/verify/admin';
import { answer } from '@/lib/verify/answer';

/**
 * Public verification API (docs/26 §4) — for the MCCI website and the future landing page on mcci.org.pk:
 *
 *   GET /api/public/verify?ref=MCCI-QR-XXXXX-XXXXX[&s=<signature>]    a certificate (QR link or typed reference)
 *   GET /api/public/verify?member=MCCI-C-1134                         a membership number
 *
 * 200 { found: true, result: {...minimal fields...}, signature: 'valid' | 'absent' | 'unconfigured' }
 * 404 { found: false } · 400 { error: 'invalid' } · 400 { error: 'tampered' } · 429 { error: 'too_many' }
 * Never cached. Cross-origin reads only from the origins in PUBLIC_API_ORIGINS (comma-separated), e.g. the new website.
 */
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const client = trustedClientIp(req.headers) ?? 'unknown';
  const ref = url.searchParams.get('ref');
  const member = url.searchParams.get('member');
  if (ref) return answer(req, await verifyByReference(ref.slice(0, 40), url.searchParams.get('s')?.slice(0, 100) || null, client));
  if (member) return answer(req, await verifyByMember(member.slice(0, 30), client));
  return answer(req, { kind: 'invalid' });
}
