import 'server-only';
import { createClient } from '@/lib/supabase/server';

/**
 * Operational reports (owner instruction Part 3.3; prototype admin/reports): aggregate counts only — no names, no
 * personal data — read with the staff member's own session (row-level security decides what each designation sees;
 * a section the person cannot read comes back empty). Demo companies are left out of every figure.
 */
export interface ReportRow {
  label: string;
  value: number;
}
export interface Report {
  from: string;
  to: string;
  sections: { key: string; rows: ReportRow[] }[];
}

type Db = Awaited<ReturnType<typeof createClient>>;

async function count(q: PromiseLike<{ count: number | null }>): Promise<number> {
  return (await q).count ?? 0;
}

export async function loadReport(from: string, to: string): Promise<Report> {
  const db: Db = await createClient();
  const start = `${from}T00:00:00+05:00`;
  const end = `${to}T23:59:59+05:00`;
  const head = { count: 'exact' as const, head: true };

  const members = async (cls: string, status: string) =>
    count(
      db
        .from('members')
        .select('id, companies!inner(demo)', head)
        .eq('companies.demo', false)
        .eq('class', cls as never)
        .eq('status', status as never),
    );
  const stage = async (s: string) =>
    count(
      db
        .from('applications')
        .select('id, companies!inner(demo)', head)
        .eq('companies.demo', false)
        .eq('stage', s as never),
    );
  const voucher = async (s: string) =>
    count(
      db
        .from('payment_vouchers')
        .select('id', head)
        .eq('status', s as never)
        .gte('created_at', start)
        .lte('created_at', end),
    );
  const service = async (s: string) =>
    count(
      db
        .from('service_requests')
        .select('id', head)
        .eq('status', s as never)
        .gte('submitted_at', start)
        .lte('submitted_at', end),
    );
  const decision = async (d: string) =>
    count(
      db
        .from('committee_items')
        .select('application_id', head)
        .eq('decision', d)
        .gte('decided_at', start)
        .lte('decided_at', end),
    );
  const verify = async (o: string) =>
    count(db.from('verify_attempts').select('id', head).eq('outcome', o).gte('at', start).lte('at', end));

  const { data: paid } = await db
    .from('payment_vouchers')
    .select('amount')
    .eq('status', 'Paid')
    .gte('paid_at', start)
    .lte('paid_at', end);
  const collected = (paid ?? []).reduce((s, v) => s + (v.amount ?? 0), 0);

  const [memRows, pipeRows, payRows, svcRows, cmtRows, verRows] = await Promise.all([
    Promise.all(
      ['Corporate', 'Associate'].flatMap((c) =>
        ['Permanent', 'Temporary', 'Expired', 'Suspended', 'Revoked'].map(async (s) => ({
          label: `${c} · ${s}`,
          value: await members(c, s),
        })),
      ),
    ),
    Promise.all(
      ['draft', 'submitted', 'review', 'returned', 'proposer', 'committee', 'payment', 'permanent', 'rejected'].map(
        async (s) => ({ label: s, value: await stage(s) }),
      ),
    ),
    Promise.all(
      ['Unpaid', 'Receipt uploaded', 'Paid', 'Rejected', 'Expired'].map(async (s) => ({
        label: s,
        value: await voucher(s),
      })),
    ),
    Promise.all(
      ['Submitted', 'In review', 'Returned', 'Ready to sign', 'Issued', 'Rejected'].map(async (s) => ({
        label: s,
        value: await service(s),
      })),
    ),
    Promise.all(['Approved', 'Rejected', 'Deferred'].map(async (d) => ({ label: d, value: await decision(d) }))),
    Promise.all(
      ['found', 'none', 'invalid', 'tampered', 'limited'].map(async (o) => ({ label: o, value: await verify(o) })),
    ),
  ]);
  const newApps = await count(
    db
      .from('applications')
      .select('id, companies!inner(demo)', head)
      .eq('companies.demo', false)
      .gte('submitted_at', start)
      .lte('submitted_at', end),
  );
  return {
    from,
    to,
    sections: [
      { key: 'membership', rows: memRows },
      { key: 'pipeline', rows: [...pipeRows, { label: 'submittedInRange', value: newApps }] },
      { key: 'payments', rows: [...payRows, { label: 'collectedPkr', value: collected }] },
      { key: 'services', rows: svcRows },
      { key: 'committee', rows: cmtRows },
      { key: 'verification', rows: verRows },
    ],
  };
}

export function reportCsv(r: Report): string {
  const cell = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
  const lines = [['section', 'item', 'count', 'from', 'to'].map(cell).join(',')];
  for (const s of r.sections)
    for (const row of s.rows) lines.push([s.key, row.label, row.value, r.from, r.to].map(cell).join(','));
  return '﻿' + lines.join('\r\n');
}
