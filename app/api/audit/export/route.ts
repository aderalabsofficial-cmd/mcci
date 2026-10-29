import { type NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/permissions/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/audit/export?days=&q=: the audit log as CSV — the IT Convener's only (migration 0500). api.audit_export
 * checks the designation and the 2-step login under the caller's own session and logs every attempt.
 */
export const dynamic = 'force-dynamic';

const NO_STORE = { 'Cache-Control': 'no-store, private', 'X-Content-Type-Options': 'nosniff' };
const COLS = [
  'at',
  'user_name',
  'action',
  'object',
  'object_id',
  'reason',
  'result',
  'old_value',
  'new_value',
] as const;

const cell = (v: unknown) => {
  const s = v === null || v === undefined ? '' : typeof v === 'object' ? JSON.stringify(v) : String(v);
  // spreadsheet formula injection: a leading = + - @ is neutralised
  const safe = /^[=+\-@]/.test(s) ? `'${s}` : s;
  return /[",\n\r]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
};

export async function GET(request: NextRequest) {
  if (!(await getSession())) return NextResponse.json({ error: 'not_allowed' }, { status: 403, headers: NO_STORE });
  const days = Number(request.nextUrl.searchParams.get('days')) || 30;
  const q = (request.nextUrl.searchParams.get('q') ?? '').slice(0, 60);
  const supabase = await createClient();
  const { data, error } = await supabase.schema('api').rpc('audit_export', { p_days: days, ...(q ? { p_q: q } : {}) });
  if (error) return NextResponse.json({ error: 'not_allowed' }, { status: 403, headers: NO_STORE });
  const rows = (data ?? []) as Record<(typeof COLS)[number], unknown>[];
  const csv = [COLS.join(','), ...rows.map((r) => COLS.map((c) => cell(r[c])).join(','))].join('\r\n');
  const day = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Karachi' });
  return new NextResponse(`﻿${csv}\r\n`, {
    headers: {
      ...NO_STORE,
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="mcci-audit-log-${day}.csv"`,
    },
  });
}
