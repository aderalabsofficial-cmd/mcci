import { NextResponse } from 'next/server';
import { msg } from '@/lib/nav/model';
import { PermissionError, requirePermission } from '@/lib/permissions/server';
import { createClient } from '@/lib/supabase/server';
import { filterVoters, loadVoterList, VOTER_RESULTS, type VoterResult } from '@/lib/voter/load';

/** GET /api/reports/voters?cutoff&class&result: the voter list as CSV. Voter list ≥ 2; every export is logged. */
export const dynamic = 'force-dynamic';

const NO_STORE = { 'Cache-Control': 'no-store, private' };
const cell = (v: unknown) => {
  const s = v === null || v === undefined ? '' : String(v);
  const safe = /^[=+\-@]/.test(s) ? `'${s}` : s;
  return /[",\n\r]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
};

export async function GET(req: Request) {
  try {
    await requirePermission('vot', 2);
  } catch (error) {
    if (error instanceof PermissionError) return NextResponse.json({ error: 'notAllowed' }, { status: 403, headers: NO_STORE });
    throw error;
  }
  const u = new URL(req.url);
  const cutoff = u.searchParams.get('cutoff') ?? '';
  if (!/^\d{4}-\d{2}-\d{2}$/.test(cutoff)) return NextResponse.json({ error: 'date' }, { status: 400, headers: NO_STORE });
  const rawClass = u.searchParams.get('class');
  const cls = rawClass === 'Corporate' || rawClass === 'Associate' ? rawClass : null;
  const rawResult = u.searchParams.get('result') ?? 'eligible';
  const result: VoterResult = (VOTER_RESULTS as readonly string[]).includes(rawResult) ? (rawResult as VoterResult) : 'eligible';
  const rows = filterVoters(await loadVoterList(cutoff, cls), result);
  const supabase = await createClient();
  const { error } = await supabase
    .schema('api')
    .rpc('voter_export_log', { p_cutoff: cutoff, p_class: cls as string, p_result: result, p_count: rows.length });
  if (error) return NextResponse.json({ error: 'generic' }, { status: 500, headers: NO_STORE });
  const head = ['Sr', 'Membership No', 'Company', 'Representative', 'Class', 'Enrollment date', 'Valid till', 'Restored on', 'Result'];
  const lines = rows.map((r, i) =>
    [
      i + 1,
      r.member_no,
      r.company,
      r.rep_name,
      r.class,
      r.since ?? '',
      r.valid_to,
      r.restored_at?.slice(0, 10) ?? '',
      r.reason ? msg('en', `voter.reasons.${r.reason}`) : msg('en', 'voter.eligible'),
    ]
      .map(cell)
      .join(','),
  );
  return new NextResponse(`﻿${[head.join(','), ...lines].join('\r\n')}`, {
    headers: {
      ...NO_STORE,
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="mcci-voter-list-${cutoff}.csv"`,
    },
  });
}
