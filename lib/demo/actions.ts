'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import type { Locale } from '@/i18n/routing';
import { asLocale } from '@/i18n/locale';
import { removeDemoLeftovers } from '@/lib/demo/admin';
import { sendInvitation } from '@/lib/invitations/email';
import { msg } from '@/lib/nav/model';
import { PermissionError, requirePermission } from '@/lib/permissions/server';
import { createClient } from '@/lib/supabase/server';

/**
 * Demo mode (migration 0350; staff reg ≥ 3): demo members (Permanent, DEMO numbers) and demo applicants for
 * presentations, each with an Owner invitation to a mailbox the Secretary General chooses; they set their own
 * passwords. Demo data stays apart from official data and is removed in one step.
 */

export interface DemoResult {
  ok: boolean;
  message: string;
}

const schema = z.object({
  kind: z.enum(['member', 'applicant']),
  company: z.string().trim().min(2).max(160),
  cls: z.enum(['Corporate', 'Associate']),
  rep: z.string().trim().min(2).max(120),
  owner: z.string().trim().min(2).max(120),
  email: z.string().trim().toLowerCase().email().max(254),
  days: z.coerce.number().int().min(1).max(30),
});

function fail(locale: Locale, error: unknown, what: string): DemoResult {
  if (error instanceof PermissionError) return { ok: false, message: msg(locale, 'demo.errors.notAllowed') };
  if (error instanceof z.ZodError) return { ok: false, message: msg(locale, 'demo.errors.fields') };
  const e = error as { code?: string; hint?: string; message?: string };
  if (e?.code === '42501') return { ok: false, message: msg(locale, 'demo.errors.notAllowed') };
  if (e?.code === 'P0001' && (e.hint === 'too_many' || e.hint === 'required')) return { ok: false, message: msg(locale, `demo.errors.${e.hint}`) };
  console.error(`${what} failed`, e?.code, e?.message);
  return { ok: false, message: msg(locale, 'demo.errors.generic') };
}

export async function addDemo(form: FormData): Promise<DemoResult> {
  const locale = asLocale(String(form.get('locale') ?? 'en'));
  try {
    const actor = await requirePermission('reg', 3);
    const d = schema.parse({
      kind: form.get('kind'),
      company: form.get('company'),
      cls: form.get('cls'),
      rep: form.get('rep'),
      owner: form.get('owner'),
      email: form.get('email'),
      days: form.get('days') ?? 7,
    });
    const supabase = await createClient();
    const { data, error } = await supabase.schema('api').rpc('demo_add', {
      p_kind: d.kind,
      p_company: d.company,
      p_class: d.cls,
      p_rep: d.rep,
      p_owner_email: d.email,
      p_owner_name: d.owner,
      p_days: d.days,
    });
    if (error) throw error;
    const row = data?.[0];
    if (!row?.token) return { ok: false, message: msg(locale, 'demo.errors.generic') };
    const sent = await sendInvitation({
      kind: 'company_user',
      to: d.email,
      name: d.owner,
      inviter: actor.access.full_name || 'MCCI',
      company: `DEMO — ${d.company}`,
      role: 'Owner',
      token: row.token,
    });
    revalidatePath('/[locale]/admin/members', 'page');
    return {
      ok: true,
      message: msg(locale, sent ? 'demo.done.added' : 'demo.done.addedNoEmail', { no: row.member_no ?? msg(locale, 'demo.applicant'), email: d.email }),
    };
  } catch (error) {
    return fail(locale, error, 'demo.add');
  }
}

export async function clearDemo(locale: Locale): Promise<DemoResult> {
  try {
    await requirePermission('reg', 3);
    const supabase = await createClient();
    const { data, error } = await supabase.schema('api').rpc('demo_clear');
    if (error) throw error;
    const rows = (data ?? []) as { kind: string; id: string }[];
    const companies = rows.filter((r) => r.kind === 'company').map((r) => r.id);
    const users = rows.filter((r) => r.kind === 'user').map((r) => r.id);
    const left = await removeDemoLeftovers(companies, users);
    revalidatePath('/[locale]/admin/members', 'page');
    return {
      ok: true,
      message: msg(locale, 'demo.done.cleared', { companies: String(companies.length), accounts: String(left.accounts), files: String(left.files) }),
    };
  } catch (error) {
    return fail(locale, error, 'demo.clear');
  }
}
