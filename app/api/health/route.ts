import { NextResponse } from 'next/server';

/**
 * Liveness for the release script and monitoring (docs/20-deployment-plan.md): the process answers, and which release
 * it runs (MCCI_RELEASE, written by scripts/deploy/release.sh). Reveals nothing else; never cached.
 */
export const dynamic = 'force-dynamic';

export function GET() {
  return NextResponse.json(
    { ok: true, release: process.env.MCCI_RELEASE ?? null },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}
