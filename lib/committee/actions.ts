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
 * Membership Committee (actions mt.create, mt.minutes; R2 / migration 0430: cmt.decide, cmt.note, cmt.assign,
 * cmt.assign.decide). Each action checks the staff member first, then calls the api.* function with their own session:
 * the database checks the designation (only the Convener of the committee the President approved decides; only the
 * SG assigns; only the President approves the assignment), the stage and the number, creates the voucher and writes
 * history, portal message and audit. Emails go out after the decision is saved and their outcome is recorded
 * (api.email_mark); a failed email never undoes a decision.
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
  email_id: number | null;
  to_email: string | null;
  name: string | null;
  token: string | null;
};

const uuid = z.string().uuid();
const meetingId = z.string().regex(/^[A-Z]{2}-[A-Z0-9-]{1,20}$/);
const note = z.string().trim().min(3).max(2000);
const refresh = () => {
  for (const p of ['committee', 'meetings', 'requests', 'mreview', 'applications']) {
    revalidatePath(`/[locale]/admin/${p}`, 'page');
  }
};

function fail(locale: Locale, error: unknown, what: string): CommitteeResult {
  const t = (k: string) => msg(locale, `committee.errors.${k}`);
  if (error instanceof PermissionError) return { ok: false, message: t('notAllowed') };
  if (error instanceof z.ZodError) return { ok: false, message: t('fields') };
  const e = error as { code?: string; hint?: string; message?: string };
  if (e?.code === '42501') return { ok: false, message: t('notAllowed') };
  if (e?.code === 'P0001' && e.hint) {
    const known = [
      'reason_required',
      'wrong_stage',
      'not_held',
      'not_on_agenda',
      'not_found',
      'required',
      'no_class',
      'fees',
      'no_number',
      'convener',
      'members',
    ];
    if (known.includes(e.hint)) return { ok: false, message: t(e.hint) };
  }
  console.error(`${what} failed`, e?.code, e?.message);
  return { ok: false, message: t('generic') };
}

/** sends the email the database queued for one decision, and records whether it went */
async function deliver(row: Decided, why: string | null): Promise<boolean> {
  if (!row.email_id || !row.to_email) return row.decision === 'Returned';
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

/** cmt.decide: the Convener approves, declines (reason) or returns the file to the Membership Officer (reason) */
export async function decide(
  locale: Locale,
  appId: string,
  decision: 'Approved' | 'Rejected' | 'Returned',
  why: string,
): Promise<CommitteeResult> {
  try {
    await requirePermission('cmt', 1);
    const d = z.enum(['Approved', 'Rejected', 'Returned']).parse(decision);
    const parsed = note.safeParse(why);
    if (d !== 'Approved' && !parsed.success) {
      return { ok: false, message: msg(locale, 'committee.errors.reason_required') };
    }
    const text = d === 'Approved' ? null : parsed.data!;
    const supabase = await createClient();
    const { data, error } = await supabase.schema('api').rpc('cmt_decide_direct', {
      p_app: uuid.parse(appId),
      p_decision: d,
      p_note: text ?? undefined,
    });
    if (error) throw error;
    refresh();
    const row = data?.[0] as Decided | undefined;
    if (!row) return fail(locale, new Error('no row'), 'cmt.decide');
    const sent = await deliver(row, text);
    const key = d === 'Approved' ? 'approved' : d === 'Rejected' ? 'rejected' : 'returnedToOfficer';
    const message = msg(locale, `committee.done.${key}`, { no: row.member_no ?? '', voucher: row.voucher_no ?? '' });
    return { ok: true, message: sent ? message : `${message} ${msg(locale, 'committee.done.emailFailed')}` };
  } catch (error) {
    return fail(locale, error, 'cmt.decide');
  }
}

/** cmt.note: a committee member's note for the Convener, on the file's history */
export async function addNote(locale: Locale, appId: string, text: string): Promise<CommitteeResult> {
  try {
    await requirePermission('cmt', 1);
    const parsed = note.safeParse(text);
    if (!parsed.success) return { ok: false, message: msg(locale, 'committee.errors.required') };
    const supabase = await createClient();
    const { error } = await supabase.schema('api').rpc('cmt_note', { p_app: uuid.parse(appId), p_note: parsed.data });
    if (error) throw error;
    refresh();
    return { ok: true, message: msg(locale, 'committee.done.noted') };
  } catch (error) {
    return fail(locale, error, 'cmt.note');
  }
}

/** cmt.assign: the Secretary General proposes the Membership Committee; the President approves it */
export async function proposeCommittee(locale: Locale, convener: string, members: string[], why: string): Promise<CommitteeResult> {
  try {
    await requirePermission('staff', 3);
    const p = z
      .object({ convener: uuid, members: z.array(uuid).max(20), why: z.string().trim().max(1000) })
      .parse({ convener, members, why });
    const supabase = await createClient();
    const { error } = await supabase
      .schema('api')
      .rpc('cmt_assign_propose', { p_convener: p.convener, p_members: p.members, p_note: p.why || undefined });
    if (error) throw error;
    refresh();
    return { ok: true, message: msg(locale, 'committee.done.proposed') };
  } catch (error) {
    return fail(locale, error, 'cmt.assign');
  }
}

/** cmt.assign.decide: the President approves the proposed committee, or does not (reason) */
export async function decideCommittee(locale: Locale, id: string, approve: boolean, why: string): Promise<CommitteeResult> {
  try {
    await requirePermission('dash', 1);
    const text = z.string().trim().max(1000).parse(why);
    if (!approve && text.length < 3) return { ok: false, message: msg(locale, 'committee.errors.reason_required') };
    const supabase = await createClient();
    const { error } = await supabase
      .schema('api')
      .rpc('cmt_assign_decide', { p_id: uuid.parse(id), p_approve: approve, p_note: text || undefined });
    if (error) throw error;
    refresh();
    return { ok: true, message: msg(locale, approve ? 'committee.done.assignApproved' : 'committee.done.assignRejected') };
  } catch (error) {
    return fail(locale, error, 'cmt.assign.decide');
  }
}
