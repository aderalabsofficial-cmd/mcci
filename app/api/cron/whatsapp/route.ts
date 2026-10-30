import { timingSafeEqual } from 'node:crypto';
import { NextResponse } from 'next/server';
import { runTick } from '@/lib/whatsapp/admin/dispatch';

/**
 * One pass of the outbound queue. Called with `Authorization: Bearer <CRON_SECRET>` by the server's timer, which is a
 * separate, approval-gated step: production has none today. Nothing goes out while settings.whatsapp.sendingEnabled is
 * false. Returns counts only.
 */
export const dynamic = 'force-dynamic';

function authorised(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  const got = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ?? '';
  if (!secret || secret.length < 32 || got.length !== secret.length) return false;
  return timingSafeEqual(Buffer.from(got), Buffer.from(secret));
}

export async function POST(req: Request) {
  if (!authorised(req)) return NextResponse.json({ error: 'unauthorised' }, { status: 401 });
  return NextResponse.json(await runTick());
}
