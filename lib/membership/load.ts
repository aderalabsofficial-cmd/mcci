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

export interface PublicSettings {
  fees: FeeSchedule;
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
      'id, token, company_id, stage, form, field_confidence, jurisdiction_ok, women, decl1, decl2, photo_path, sign_path, stamp_path, class, return_note, reject_note, submitted_at, created_at',
    )
    .in('company_id', companyIds)
    .order('created_at', { ascending: false });
  if (error) throw new Error(`applications: ${error.message}`);
  const row = (apps ?? []).find((a) => !FINAL.includes(a.stage as AppStage)) ?? apps?.[0];
  if (!row) return null;

  const [docs, partners, history, requirements] = await Promise.all([
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
  ]);
  for (const r of [docs, partners, history]) if (r.error) throw new Error(r.error.message);
  const level = session.access.companies.find((c) => c.id === row.company_id)?.levels.mship ?? 0;
  return {
    ...(row as Omit<MyApplication, 'docs' | 'partners' | 'requirements' | 'history' | 'canEdit' | 'canManage'>),
    form: (row.form ?? {}) as AppForm,
    field_confidence: (row.field_confidence ?? {}) as Record<string, number>,
    docs: (docs.data ?? []) as AppDocument[],
    partners: (partners.data ?? []) as AppPartner[],
    history: (history.data ?? []) as AppHistory[],
    requirements,
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
