import 'server-only';
import { cache } from 'react';
import type { AppForm, DocRequirement, FeeSchedule, MembershipRules } from '@/lib/flow/application';
import { isBiz } from '@/lib/flow/application';
import type { AppStage, BizType } from '@/lib/membership/reference';
import { getSession } from '@/lib/permissions/server';
import { createClient } from '@/lib/supabase/server';

/**
 * Everything the member screens show about the signed-in person's membership application, read with their own
 * session (RLS: only their companies' rows). Cached per request.
 */

export interface AppDocument {
  id: string;
  key: string;
  path: string;
  file_name: string | null;
  mime: string | null;
  size_bytes: number | null;
  status: 'pending' | 'ok' | 'rejected';
  reject_reason: string | null;
  created_at: string;
}

export interface AppPartner {
  id: string;
  position: number;
  name: string;
  cnic: string | null;
  mobile: string | null;
  extra_card: boolean;
}

export interface AppHistory {
  at: string;
  step: string;
  note: string | null;
  by_name: string | null;
}

export interface AppEndorsement {
  id: string;
  role: 'proposer' | 'seconder';
  status: 'Pending' | 'Approved' | 'Declined' | 'Expired' | 'Withdrawn';
  member_no: string;
  company: string;
  rep: string;
  message: string | null;
  requested_at: string;
  expires_at: string;
  decided_at: string | null;
  decline_reason: string | null;
  ref: string | null;
  reminders: number;
  last_reminded_at: string | null;
  signature_path: string | null;
}

/** endorsements of one application with the endorsers' public details (api.app_endorsements, migration 0320) */
export async function loadEndorsements(appId: string): Promise<AppEndorsement[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.schema('api').rpc('app_endorsements', { p_app: appId });
  if (error) throw new Error(`app_endorsements: ${error.message}`);
  return (data ?? []) as AppEndorsement[];
}

export interface MyApplication {
  id: string;
  token: string;
  company_id: string;
  stage: AppStage;
  form: AppForm;
  field_confidence: Record<string, number>;
  jurisdiction_ok: boolean | null;
  women: boolean;
  decl1: boolean;
  decl2: boolean;
  photo_path: string | null;
  sign_path: string | null;
  stamp_path: string | null;
  class: 'Corporate' | 'Associate' | null;
  return_note: string | null;
  reject_note: string | null;
  submitted_at: string | null;
  created_at: string;
  docs: AppDocument[];
  partners: AppPartner[];
  requirements: DocRequirement[];
  history: AppHistory[];
  endorsements: AppEndorsement[];
  /** the membership number the committee allocated (from approval on) */
  member_no: string | null;
  /** the open agenda item while with the committee (members cannot read meeting dates) */
  agenda: { meeting: string; item: number | null } | null;
  /** the live membership payment voucher after approval */
  voucher: { no: string; amount: number; due_at: string; status: string; reject_reason: string | null } | null;
  /** the member row (from temporary membership on) */
  member_id: string | null;
  /** the temporary membership and its certificate */
  temp: { expires_at: string; status: string; code: string | null } | null;
  /** this person may change the draft (company area mship ≥ 2, stage draft or returned) */
  canEdit: boolean;
  /** this person may act on the application at all (Owner / Manager: company area mship ≥ 2) */
  canManage: boolean;
}

export interface Chamber {
  name: string;
  addr: string;
  tel: string;
  fax: string;
  email: string;
  web: string;
}

export interface EndorseRules {
  days: number;
  maxPerYear: number;
  needCode: boolean;
}

export interface PublicSettings {
  fees: FeeSchedule;
  endorse: EndorseRules;
  membership: MembershipRules;
  chamber: Chamber;
  /** normal membership process time printed on the form (settings.sla.processDays) */
  processDays: number;
}

const FINAL: AppStage[] = ['rejected', 'withdrawn'];

export const loadPublicSettings = cache(async (): Promise<PublicSettings> => {
  const supabase = await createClient();
  const { data, error } = await supabase.from('public_settings').select('key, value');
  if (error) throw new Error(`public_settings: ${error.message}`);
  const s = Object.fromEntries((data ?? []).map((r) => [r.key, r.value])) as Record<string, unknown>;
  return {
    fees: s.fees as FeeSchedule,
    endorse: {
      days: Number((s.endorse as Partial<EndorseRules> | undefined)?.days ?? 7),
      maxPerYear: Number((s.endorse as Partial<EndorseRules> | undefined)?.maxPerYear ?? 12),
      needCode: (s.endorse as Partial<EndorseRules> | undefined)?.needCode !== false,
    },
    membership: (s.membership ?? {}) as MembershipRules,
    chamber: s.chamber as Chamber,
    processDays: Number((s.sla as { processDays?: number } | undefined)?.processDays ?? 15),
  };
});

/** the document checklist of every business type, for pages 3–4 of the official form */
export const loadDocLists = cache(async (): Promise<Record<BizType, string[]>> => {
  const supabase = await createClient();
  const { data, error } = await supabase.from('document_requirements').select('biz_type, label_en, sort').order('sort');
  if (error) throw new Error(`document_requirements: ${error.message}`);
  const out: Record<BizType, string[]> = { prop: [], aop: [], pvt: [], mnc: [], public: [] };
  for (const r of data ?? []) out[r.biz_type as BizType].push(r.label_en);
  return out;
});

export async function loadRequirements(biz: string | undefined): Promise<DocRequirement[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('document_requirements')
    .select('key, label_en, required, sort')
    .eq('biz_type', isBiz(biz) ? biz : 'prop')
    .order('sort');
  if (error) throw new Error(`document_requirements: ${error.message}`);
  return (data ?? []) as DocRequirement[];
}

/** the person's current application: the newest one that is still open, else the newest one; null if none */
export const loadMyApplication = cache(async (): Promise<MyApplication | null> => {
  const session = await getSession();
  if (!session) return null;
  const companyIds = session.access.companies.map((c) => c.id);
  if (!companyIds.length) return null;
  const supabase = await createClient();
  const { data: apps, error } = await supabase
    .from('applications')
    .select(
      'id, token, company_id, stage, form, field_confidence, jurisdiction_ok, women, decl1, decl2, photo_path, sign_path, stamp_path, class, return_note, reject_note, submitted_at, created_at, member_no, member_id',
    )
    .in('company_id', companyIds)
    .order('created_at', { ascending: false });
  if (error) throw new Error(`applications: ${error.message}`);
  const row = (apps ?? []).find((a) => !FINAL.includes(a.stage as AppStage)) ?? apps?.[0];
  if (!row) return null;

  const [docs, partners, history, requirements, endorsements, items, vouchers, temps] = await Promise.all([
    supabase
      .from('application_documents')
      .select('id, key, path, file_name, mime, size_bytes, status, reject_reason, created_at')
      .eq('application_id', row.id),
    supabase
      .from('application_partners')
      .select('id, position, name, cnic, mobile, extra_card')
      .eq('application_id', row.id)
      .order('position'),
    supabase
      .from('application_history')
      .select('at, step, note, by_name')
      .eq('application_id', row.id)
      .order('at', { ascending: false }),
    loadRequirements((row.form as AppForm | null)?.biz),
    loadEndorsements(row.id),
    supabase.from('committee_items').select('meeting_id, item_no').eq('application_id', row.id).is('decision', null),
    supabase
      .from('payment_vouchers')
      .select('voucher_no, amount, due_at, status, reject_reason')
      .eq('ref_type', 'membership')
      .eq('ref_id', row.id)
      .not('status', 'in', '(Cancelled,Expired)')
      .order('created_at', { ascending: false })
      .limit(1),
    row.member_id
      ? supabase
          .from('temp_memberships')
          .select('expires_at, status, documents(code)')
          .eq('member_id', row.member_id)
          .order('issued_at', { ascending: false })
          .limit(1)
      : Promise.resolve({ data: [] as { expires_at: string; status: string; documents: unknown }[] }),
  ]);
  for (const r of [docs, partners, history]) if (r.error) throw new Error(r.error.message);
  const level = session.access.companies.find((c) => c.id === row.company_id)?.levels.mship ?? 0;
  return {
    ...(row as Omit<
      MyApplication,
      'docs' | 'partners' | 'requirements' | 'history' | 'endorsements' | 'canEdit' | 'canManage' | 'agenda' | 'voucher' | 'temp'
    >),
    form: (row.form ?? {}) as AppForm,
    field_confidence: (row.field_confidence ?? {}) as Record<string, number>,
    docs: (docs.data ?? []) as AppDocument[],
    partners: (partners.data ?? []) as AppPartner[],
    history: (history.data ?? []) as AppHistory[],
    requirements,
    endorsements,
    agenda: items.data?.[0] ? { meeting: items.data[0].meeting_id, item: items.data[0].item_no } : null,
    voucher: vouchers.data?.[0]
      ? {
          no: vouchers.data[0].voucher_no,
          amount: vouchers.data[0].amount,
          due_at: vouchers.data[0].due_at,
          status: vouchers.data[0].status,
          reject_reason: vouchers.data[0].reject_reason,
        }
      : null,
    temp: temps.data?.[0]
      ? {
          expires_at: temps.data[0].expires_at,
          status: temps.data[0].status,
          code: (temps.data[0].documents as unknown as { code: string } | null)?.code ?? null,
        }
      : null,
    canEdit: level >= 2 && (row.stage === 'draft' || row.stage === 'returned'),
    canManage: level >= 2,
  };
});

/** a private file for the screen: signed URL valid for 10 minutes (CLAUDE.md §6) */
export async function signedUrl(path: string | null): Promise<string | null> {
  if (!path) return null;
  const supabase = await createClient();
  const { data } = await supabase.storage.from('application-docs').createSignedUrl(path, 600);
  return data?.signedUrl ? publicStorageUrl(data.signedUrl) : null;
}

/** the server talks to Supabase on its internal address (SUPABASE_INTERNAL_URL); browsers need the public one */
export function publicStorageUrl(url: string): string {
  const pub = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!pub) return url;
  const u = new URL(url);
  return new URL(u.pathname + u.search, pub).toString();
}
