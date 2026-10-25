import 'server-only';
import { createClient } from '@/lib/supabase/server';

/** Temporary memberships and the QR registry for staff (prototype admin/temp, admin/documents); RLS temp / docs ≥ 1. */

export interface TempRow {
  id: string;
  member_no: string;
  company: string;
  issued_at: string;
  expires_at: string;
  extensions: number;
  status: 'active' | 'expired' | 'converted' | 'revoked';
  code: string | null;
  print: string | null;
}

export interface PaidWaiting {
  appId: string;
  token: string;
  name: string;
  member_no: string | null;
  paid_at: string | null;
}

export async function loadTemps(): Promise<{ temps: TempRow[]; waiting: PaidWaiting[] }> {
  const supabase = await createClient();
  const [{ data: ts, error }, { data: apps }] = await Promise.all([
    supabase
      .from('temp_memberships')
      .select('id, issued_at, expires_at, extensions, status, member_id, members(member_no, companies(name)), documents(code)')
      .order('expires_at'),
    supabase.from('applications').select('id, token, form, member_no').eq('stage', 'payment'),
  ]);
  if (error) throw new Error(`temp: ${error.message}`);
  const memberIds = (ts ?? []).map((t) => t.member_id);
  const { data: prints } = memberIds.length
    ? await supabase.from('print_items').select('member_id, status, serial').in('member_id', memberIds)
    : { data: [] as { member_id: string; status: string; serial: string | null }[] };
  const ids = (apps ?? []).map((a) => a.id);
  const { data: paid } = ids.length
    ? await supabase.from('payment_vouchers').select('ref_id, paid_at').eq('ref_type', 'membership').eq('status', 'Paid').in('ref_id', ids)
    : { data: [] as { ref_id: string; paid_at: string | null }[] };
  return {
    temps: (ts ?? []).map((t) => {
      const m = t.members as unknown as { member_no: string; companies: { name: string } | null } | null;
      const p = (prints ?? []).find((x) => x.member_id === t.member_id);
      return {
        id: t.id,
        member_no: m?.member_no ?? '—',
        company: m?.companies?.name ?? '—',
        issued_at: t.issued_at,
        expires_at: t.expires_at,
        extensions: t.extensions,
        status: t.status as TempRow['status'],
        code: (t.documents as unknown as { code: string } | null)?.code ?? null,
        print: p ? `${p.status}${p.serial ? ` · ${p.serial}` : ''}` : null,
      };
    }),
    waiting: (apps ?? [])
      .filter((a) => (paid ?? []).some((v) => v.ref_id === a.id))
      .map((a) => ({
        appId: a.id,
        token: a.token,
        name: ((a.form ?? {}) as { name?: string }).name ?? '',
        member_no: a.member_no,
        paid_at: (paid ?? []).find((v) => v.ref_id === a.id)?.paid_at ?? null,
      })),
  };
}

export interface DocRow {
  code: string;
  kind: string;
  title: string;
  company: string;
  member_no: string | null;
  status: string;
  scans: number;
  created_at: string;
  valid_to: string | null;
}

export async function loadRegistry(): Promise<DocRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('documents')
    .select('code, kind, title, status, scans, created_at, valid_to, companies(name), members(member_no)')
    .order('created_at', { ascending: false })
    .limit(500);
  if (error) throw new Error(`documents: ${error.message}`);
  return (data ?? []).map((d) => ({
    code: d.code,
    kind: d.kind,
    title: d.title,
    company: (d.companies as unknown as { name: string } | null)?.name ?? '—',
    member_no: (d.members as unknown as { member_no: string } | null)?.member_no ?? null,
    status: d.status,
    scans: d.scans,
    created_at: d.created_at,
    valid_to: d.valid_to,
  }));
}

export interface TempPolicy {
  days: number;
  alert1: number;
  alert2: number;
  extendDays: number;
  maxExtensions: number;
  autoIssue: boolean;
}

/** settings.temp for staff screens (api.temp_policy, temp ≥ 1); the defaults of docs/02 when a key is missing */
export async function loadTempPolicy(): Promise<TempPolicy> {
  const supabase = await createClient();
  const { data } = await supabase.schema('api').rpc('temp_policy');
  const t = (data ?? {}) as Record<string, unknown>;
  const n = (k: string, d: number) => (typeof t[k] === 'number' ? (t[k] as number) : d);
  return {
    days: n('days', 60),
    alert1: n('alert1', 15),
    alert2: n('alert2', 7),
    extendDays: n('extendDays', 30),
    maxExtensions: n('maxExtensions', 1),
    autoIssue: t.autoIssue !== false,
  };
}
