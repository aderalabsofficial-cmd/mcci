import { trustedClientIp } from '@/lib/net/client-ip';
import { verifyByReference } from '@/lib/verify/admin';
import { answer } from '@/lib/verify/answer';

/** GET /api/verify/{reference}[?s=]: the same minimal answer as /api/public/verify?ref= (kept for existing links). */
export const dynamic = 'force-dynamic';

export async function GET(req: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const sig = new URL(req.url).searchParams.get('s')?.slice(0, 100) || null;
  return answer(
    req,
    await verifyByReference(decodeURIComponent(code).slice(0, 40), sig, trustedClientIp(req.headers) ?? 'unknown'),
  );
}
