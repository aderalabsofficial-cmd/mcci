import { NextResponse } from 'next/server';
import { getSession } from '@/lib/permissions/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/register/export: the members register as CSV — the IT Convener's only (owner, 28 Oct 2026; migration 0460).
 * api.register_export checks the designation and the 2-step login under the caller's own session, and logs every
 * attempt (allowed or refused) in file_access_log.
 */
export const dynamic = 'force-dynamic';

const NO_STORE = { 'Cache-Control': 'no-store, private', 'X-Content-Type-Options': 'nosniff' };
const COLS = [
  'member_no',
  'company',
  'class',
  'women',
  'status',
  'rep_name',
  'since',
  'valid_to',
  'ntn',
  'gst',
  'address',
  'tel',
  'email',
  'sector',
  'blacklisted',
] as const;

const cell = (v: unknown) => {
  const s = v === null || v === undefined ? '' : String(v);
  // spreadsheet formula injection: a leading = + - @ is neutralised
  const safe = /^[=+\-@]/.test(s) ? `'${s}` : s;
  return /[",\n\r]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
};

export async function GET() {
  if (!(await getSession())) return NextResponse.json({ error: 'not_allowed' }, { status: 403, headers: NO_STORE });
  const supabase = await createClient();
  const { data, error } = await supabase.schema('api').rpc('register_export');
  if (error) return NextResponse.json({ error: 'not_allowed' }, { status: 403, headers: NO_STORE });
  const rows = (data ?? []) as Record<(typeof COLS)[number], unknown>[];
  const csv = [COLS.join(','), ...rows.map((r) => COLS.map((c) => cell(r[c])).join(','))].join('\r\n');
  const day = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Karachi' });
  return new NextResponse(`﻿${csv}\r\n`, {
    headers: {
      ...NO_STORE,
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="mcci-members-register-${day}.csv"`,
    },
  });
}
