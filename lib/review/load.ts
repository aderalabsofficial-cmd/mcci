import 'server-only';
import type { AppForm, DocRequirement } from '@/lib/flow/application';
import type { AppDocument, AppHistory, AppPartner } from '@/lib/membership/load';
import { loadRequirements } from '@/lib/membership/load';
import type { AppStage } from '@/lib/membership/reference';
import { createClient } from '@/lib/supabase/server';

/**
 * Staff reads for the Membership Pipeline and Application Review, with the officer's own session: RLS lets staff with
 * module 'mem' ≥ 1 (and a 2-step session, migration 0310) read applications, their documents, partners, history and
 * the email status; nobody else.
 */

export interface PipelineRow {
  id: string;
  token: string;
  stage: AppStage;
  name: string;
  biz: string | null;
  cls: 'Corporate' | 'Associate' | null;
  women: boolean;
  submitted_at: string | null;
  /** demo mode (0350): shown marked, never counted */
  demo: boolean;
}

export async function loadPipeline(): Promise<PipelineRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('applications')
    .select('id, token, stage, form, class, women, submitted_at, companies(demo)')
    .neq('stage', 'draft')
    .order('submitted_at', { ascending: false, nullsFirst: false });
  if (error) throw new Error(`applications: ${error.message}`);
  return (data ?? []).map((a) => {
    const f = (a.form ?? {}) as AppForm;
    return {
      id: a.id,
      token: a.token,
      stage: a.stage as AppStage,
      name: f.name ?? '',
      biz: f.biz ?? null,
      cls: a.class,
      women: a.women,
      submitted_at: a.submitted_at,
      demo: (a.companies as unknown as { demo: boolean } | null)?.demo === true,
    };
  });
}

export interface EmailRow {
  id: number;
  template_key: string | null;
  status: string | null;
  at: string;
}

export interface ReviewFile {
  id: string;
  token: string;
  stage: AppStage;
  form: AppForm;
  field_confidence: Record<string, number>;
  class: 'Corporate' | 'Associate' | null;
  women: boolean;
  review: { checks?: Record<string, boolean> };
  return_note: string | null;
  reject_note: string | null;
  submitted_at: string | null;
  photo_path: string | null;
  sign_path: string | null;
  stamp_path: string | null;
  jurisdiction_ok: boolean | null;
  docs: AppDocument[];
  partners: AppPartner[];
  history: AppHistory[];
  requirements: DocRequirement[];
  emails: EmailRow[];
  /** document keys that were replaced after a rejection (more than one version) */
  reuploaded: string[];
}

export async function loadReviewFile(token: string): Promise<ReviewFile | null> {
  if (!/^MCCI-\d{4}-M-\d{4,}$/.test(token)) return null;
  const supabase = await createClient();
  const { data: a, error } = await supabase
    .from('applications')
    .select(
      'id, token, stage, form, field_confidence, class, women, review, return_note, reject_note, submitted_at, photo_path, sign_path, stamp_path, jurisdiction_ok',
    )
    .eq('token', token)
    .maybeSingle();
  if (error) throw new Error(`applications: ${error.message}`);
  if (!a) return null;
  const [docs, partners, history, emails, versions] = await Promise.all([
    supabase
      .from('application_documents')
      .select('id, key, path, file_name, mime, size_bytes, status, reject_reason, created_at')
      .eq('application_id', a.id),
    supabase
      .from('application_partners')
      .select('id, position, name, cnic, mobile, extra_card')
      .eq('application_id', a.id)
      .order('position'),
    supabase
      .from('application_history')
      .select('at, step, note, by_name')
      .eq('application_id', a.id)
      .order('at', { ascending: false }),
    supabase
      .from('email_log')
      .select('id, template_key, status, at')
      .eq('application_id', a.id)
      .order('at', { ascending: false }),
    supabase.from('application_document_versions').select('key').eq('application_id', a.id),
  ]);
  for (const r of [docs, partners, history, emails, versions]) if (r.error) throw new Error(r.error.message);
  const counts = new Map<string, number>();
  for (const v of versions.data ?? []) counts.set(v.key, (counts.get(v.key) ?? 0) + 1);
  const form = (a.form ?? {}) as AppForm;
  return {
    ...a,
    stage: a.stage as AppStage,
    form,
    field_confidence: (a.field_confidence ?? {}) as Record<string, number>,
    review: (a.review ?? {}) as ReviewFile['review'],
    docs: (docs.data ?? []) as AppDocument[],
    partners: (partners.data ?? []) as AppPartner[],
    history: (history.data ?? []) as AppHistory[],
    emails: (emails.data ?? []) as EmailRow[],
    requirements: await loadRequirements(form.biz),
    reuploaded: [...counts].filter(([, n]) => n > 1).map(([k]) => k),
  };
}
