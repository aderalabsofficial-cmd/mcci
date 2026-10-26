import 'server-only';
import type { Access } from '@/lib/permissions/levels';
import { createClient } from '@/lib/supabase/server';

/**
 * Service requests (migration 0380) as the person may see them under RLS: a member company's own requests (drafts
 * included), staff everything but drafts. Signed URLs for documents last 10 minutes (CLAUDE.md §6).
 */

export type SvcStatus = 'Submitted' | 'In review' | 'Returned' | 'Ready to sign' | 'Issued' | 'Rejected' | 'Cancelled';

export interface SvcRow {
  id: string;
  token: string;
  company_id: string;
  company: string;
  service_key: string;
  status: SvcStatus;
  draft: boolean;
  data: Record<string, string>;
  submitted_at: string;
  sla_due_at: string;
  started_at: string | null;
  approved_at: string | null;
  issued_at: string | null;
  return_note: string | null;
  reject_reason: string | null;
  issued_doc: string | null;
}

const COLS =
  'id, token, company_id, service_key, status, draft, data, submitted_at, sla_due_at, started_at, approved_at, issued_at, return_note, reject_reason, issued_doc, companies(name)';

type Raw = Omit<SvcRow, 'company'> & { companies: { name: string } | null };
const row = (r: Raw): SvcRow => ({ ...r, company: r.companies?.name ?? '', data: (r.data ?? {}) as Record<string, string> });

/** the member's company for services: the first one where they may request (svc ≥ 2), else any they can see */
export function serviceCompany(access: Access) {
  return access.companies.find((c) => (c.levels.svc ?? 0) >= 2) ?? access.companies.find((c) => (c.levels.svc ?? 0) >= 1) ?? null;
}

export async function loadEligible(companyId: string): Promise<boolean> {
  const supabase = await createClient();
  const { data } = await supabase.schema('api').rpc('svc_can', { p_company: companyId });
  return data === true;
}

export async function loadMyRequests(companyId: string): Promise<SvcRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('service_requests')
    .select(COLS)
    .eq('company_id', companyId)
    .neq('status', 'Cancelled')
    .order('submitted_at', { ascending: false });
  if (error) throw new Error(`service_requests: ${error.message}`);
  return ((data ?? []) as unknown as Raw[]).map(row);
}

export async function loadRequests(): Promise<SvcRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('service_requests')
    .select(COLS)
    .eq('draft', false)
    .neq('status', 'Cancelled')
    .order('sla_due_at');
  if (error) throw new Error(`service_requests: ${error.message}`);
  return ((data ?? []) as unknown as Raw[]).map(row);
}

export interface SvcDetail extends SvcRow {
  docs: { id: string; key: string; file_name: string | null; created_at: string; url: string | null }[];
  history: { step: string; note: string | null; by_name: string | null; at: string }[];
  messages: { id: number; body: string; at: string; by_name: string | null; mine: boolean }[];
  voucher: { voucher_no: string; amount: number; status: string } | null;
  doc: { code: string; status: string; title: string; created_at: string } | null;
  member: { member_no: string; status: string; valid_to: string } | null;
}

export async function loadRequest(token: string, userId: string): Promise<SvcDetail | null> {
  const supabase = await createClient();
  const { data } = await supabase.from('service_requests').select(COLS).eq('token', token).maybeSingle();
  if (!data) return null;
  const r = row(data as unknown as Raw);
  const [docs, hist, msgs, voucher, doc, member] = await Promise.all([
    supabase.from('service_documents').select('id, key, path, file_name, created_at').eq('request_id', r.id).order('created_at'),
    supabase.from('service_history').select('step, note, by_name, at').eq('request_id', r.id).order('at'),
    supabase.from('service_messages').select('id, body, at, by_user').eq('request_id', r.id).order('at'),
    supabase.from('payment_vouchers').select('voucher_no, amount, status').eq('ref_type', 'service').eq('ref_id', r.id).order('created_at', { ascending: false }).limit(1).maybeSingle(),
    r.issued_doc ? supabase.from('documents').select('code, status, title, created_at').eq('id', r.issued_doc).maybeSingle() : Promise.resolve({ data: null }),
    supabase.from('members').select('member_no, status, valid_to').eq('company_id', r.company_id).order('valid_to', { ascending: false }).limit(1).maybeSingle(),
  ]);
  const paths = (docs.data ?? []).map((d) => d.path);
  const signed = paths.length ? (await supabase.storage.from('service-docs').createSignedUrls(paths, 600)).data ?? [] : [];
  // the names of who wrote each message (colleagues and staff are not readable profiles for members: use the role)
  return {
    ...r,
    docs: (docs.data ?? []).map((d, i) => ({ id: d.id, key: d.key, file_name: d.file_name, created_at: d.created_at, url: signed[i]?.signedUrl ?? null })),
    history: (hist.data ?? []) as SvcDetail['history'],
    messages: (msgs.data ?? []).map((m) => ({ id: m.id, body: m.body, at: m.at, by_name: null, mine: m.by_user === userId })),
    voucher: (voucher.data as SvcDetail['voucher']) ?? null,
    doc: (doc.data as SvcDetail['doc']) ?? null,
    member: (member.data as SvcDetail['member']) ?? null,
  };
}

/** time left on the SLA clock, as hours and minutes; negative when overdue */
export function timeLeft(due: string, now = Date.now()): { overdue: boolean; h: number; m: number } {
  const ms = new Date(due).getTime() - now;
  const abs = Math.abs(ms);
  return { overdue: ms < 0, h: Math.floor(abs / 3_600_000), m: Math.floor((abs % 3_600_000) / 60_000) };
}
