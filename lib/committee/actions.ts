'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import type { Locale } from '@/i18n/routing';
import { COMMITTEES } from '@/lib/committee/load';
import { voucherEmail } from '@/lib/committee/emails';
import { sendEmail } from '@/lib/email/send';
import { decisionEmail } from '@/lib/membership/emails';
import { msg } from '@/lib/nav/model';
import { PermissionError, requirePermission } from '@/lib/permissions/server';
import { createClient } from '@/lib/supabase/server';

/**
 * Membership Committee (actions mt.create, mt.minutes, cmt.decide, cmt.approveAll; docs/06: meetings cmt ≥ 2,
 * decisions cmt ≥ 3). Each action checks the staff member first, then calls the api.* function of migration 0330
 * with their own session: the database checks the level, the stage, the meeting and that the item is still open,
 * allocates the membership number, creates the voucher and writes history, portal message and audit. Emails go out
 * after the decision is saved and their outcome is recorded (api.email_mark); a failed email never undoes a decision.
 */

export interface CommitteeResult {
  ok: boolean;
  message: string;
}

type Decided = {
  decision: string;
  member_no: string | null;
  voucher_no: string | null;
  amount: number | null;
  due_at: string | null;
  next_meeting: string | null;
  email_id: number | null;
  to_email: string | null;
  name: string | null;
  token: string | null;
};

const uuid = z.string().uuid();
const meetingId = z.string().regex(/^[A-Z]{2}-[A-Z0-9-]{1,20}$/);
const note = z.string().trim().min(3).max(2000);
const refresh = () => {
  for (const p of ['committee', 'meetings', 'requests', 'mreview']) revalidatePath(`/[locale]/admin/${p}`, 'page');
};

function fail(locale: Locale, error: unknown, what: string): CommitteeResult {
  const t = (k: string) => msg(locale, `committee.errors.${k}`);
  if (error instanceof PermissionError) return { ok: false, message: t('notAllowed') };
  if (error instanceof z.ZodError) return { ok: false, message: t('fields') };
  const e = error as { code?: string; hint?: string; message?: string };
  if (e?.code === '42501') return { ok: false, message: t('notAllowed') };
  if (e?.code === 'P0001' && e.hint) {
    const known = ['reason_required', 'wrong_stage', 'not_held', 'not_on_agenda', 'not_found', 'required', 'no_class', 'fees'];
    if (known.includes(e.hint)) return { ok: false, message: t(e.hint) };
  }
  console.error(`${what} failed`, e?.code, e?.message);
  return { ok: false, message: t('generic') };
}

/** sends the email the database queued for one decision, and records whether it went */
async function deliver(row: Decided, why: string | null): Promise<boolean> {
  if (!row.email_id || !row.to_email) return row.decision === 'Deferred';
  const supabase = await createClient();
  try {
    let mail;
    if (row.decision === 'Approved') {
      const { data: v } = await supabase.schema('api').rpc('voucher_view', { p_voucher: row.voucher_no! });
      const bank = (v?.[0]?.bank ?? {}) as Record<string, unknown>;
      mail = voucherEmail({
        to: row.to_email,
        name: row.name,
        token: row.token ?? '',
        memberNo: row.member_no ?? '',
        voucherNo: row.voucher_no ?? '',
        amount: row.amount ?? 0,
        dueAt: row.due_at ?? '',
        bank,
      });
    } else {
      mail = decisionEmail('rejected', row.to_email, row.name ?? '', row.token ?? '', why);
    }
    const id = await sendEmail(mail);
    await supabase.schema('api').rpc('email_mark', { p_email: row.email_id, p_ok: true, p_provider_id: id });
    return true;
  } catch (error) {
    await supabase
      .schema('api')
      .rpc('email_mark', { p_email: row.email_id, p_ok: false, p_error: (error as Error)?.message?.slice(0, 200) ?? 'not sent' });
    console.error(`committee ${row.decision} email not sent`, (error as Error)?.name);
    return false;
  }
}

export async function createMeeting(locale: Locale, form: FormData): Promise<CommitteeResult> {
  try {
    await requirePermission('cmt', 2);
    const p = z
      .object({
        name: z.string().trim().min(2).max(120),
        committee: z.enum(COMMITTEES as [string, ...string[]]),
        date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      })
      .parse({ name: form.get('name'), committee: form.get('committee'), date: form.get('date') });
    const supabase = await createClient();
    const { data, error } = await supabase
      .schema('api')
      .rpc('cmt_meeting_create', { p_committee: p.committee, p_name: p.name, p_held_on: p.date });
    if (error) throw error;
    refresh();
    const r = data?.[0];
    return {
      ok: true,
      message: msg(locale, 'committee.done.scheduled', { id: r?.meeting_id ?? '', n: String(r?.placed ?? 0) }),
    };
  } catch (error) {
    return fail(locale, error, 'mt.create');
  }
}

export async function recordMinutes(locale: Locale, meeting: string, minutes: string): Promise<CommitteeResult> {
  try {
    await requirePermission('cmt', 2);
    const text = z.string().trim().min(3).max(20000).parse(minutes);
    const supabase = await createClient();
    const { error } = await supabase
      .schema('api')
      .rpc('cmt_minutes', { p_meeting: meetingId.parse(meeting), p_minutes: text });
    if (error) throw error;
    refresh();
    return { ok: true, message: msg(locale, 'committee.done.minutes') };
  } catch (error) {
    return fail(locale, error, 'mt.minutes');
  }
}

export async function decide(
  locale: Locale,
  appId: string,
  meeting: string,
  decision: 'Approved' | 'Deferred' | 'Rejected',
  why: string,
): Promise<CommitteeResult> {
  try {
    await requirePermission('cmt', 3);
    const d = z.enum(['Approved', 'Deferred', 'Rejected']).parse(decision);
    const parsed = note.safeParse(why);
    if (d !== 'Approved' && !parsed.success) {
      return { ok: false, message: msg(locale, 'committee.errors.reason_required') };
    }
    const text = d === 'Approved' ? null : parsed.data!;
    const supabase = await createClient();
    const { data, error } = await supabase.schema('api').rpc('cmt_decide', {
      p_app: uuid.parse(appId),
      p_meeting: meetingId.parse(meeting),
      p_decision: d,
      p_note: text ?? undefined,
    });
    if (error) throw error;
    refresh();
    const row = data?.[0] as Decided | undefined;
    if (!row) return fail(locale, new Error('no row'), 'cmt.decide');
    const sent = await deliver(row, text);
    const key = d === 'Approved' ? 'approved' : d === 'Rejected' ? 'rejected' : row.next_meeting ? 'deferred' : 'deferredWaiting';
    const message = msg(locale, `committee.done.${key}`, {
      no: row.member_no ?? '',
      voucher: row.voucher_no ?? '',
      meeting: row.next_meeting ?? '',
    });
    return { ok: true, message: sent ? message : `${message} ${msg(locale, 'committee.done.emailFailed')}` };
  } catch (error) {
    return fail(locale, error, 'cmt.decide');
  }
}

export async function approveAll(locale: Locale, meeting: string): Promise<CommitteeResult> {
  try {
    await requirePermission('cmt', 3);
    const supabase = await createClient();
    const { data, error } = await supabase.schema('api').rpc('cmt_approve_all', { p_meeting: meetingId.parse(meeting) });
    if (error) throw error;
    refresh();
    const rows = (data ?? []) as Decided[];
    let failed = 0;
    for (const r of rows) if (!(await deliver(r, null))) failed++;
    const message = msg(locale, 'committee.done.approvedAll', { n: String(rows.length) });
    return { ok: true, message: failed ? `${message} ${msg(locale, 'committee.done.emailFailed')}` : message };
  } catch (error) {
    return fail(locale, error, 'cmt.approveAll');
  }
}
