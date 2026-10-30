import { NextResponse } from 'next/server';
import { PermissionError, requirePermission } from '@/lib/permissions/server';
import { loadReport, reportCsv } from '@/lib/reports/load';

/**
 * GET /api/reports?from=YYYY-MM-DD&to=YYYY-MM-DD — the Reports screen's figures as CSV (aggregate counts only, no
 * personal data). Staff with Reports ≥ 1 and the 2-step login; read with their own session (RLS).
 */
export const dynamic = 'force-dynamic';

const DAY = /^\d{4}-\d{2}-\d{2}$/;

export async function GET(req: Request) {
  try {
    await requirePermission('rep', 1);
  } catch (error) {
    if (error instanceof PermissionError) return NextResponse.json({ error: 'not_allowed' }, { status: 403 });
    throw error;
  }
  const u = new URL(req.url);
  const from = u.searchParams.get('from') ?? '';
  const to = u.searchParams.get('to') ?? '';
  if (!DAY.test(from) || !DAY.test(to) || to < from) return NextResponse.json({ error: 'invalid' }, { status: 400 });
  const csv = reportCsv(await loadReport(from, to));
  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="mcci-report-${from}-${to}.csv"`,
      'Cache-Control': 'no-store, private',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
