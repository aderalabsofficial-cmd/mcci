'use server';

import { z } from 'zod';
import type { Locale } from '@/i18n/routing';
import { sendEmail } from '@/lib/email/send';
import { type Decision, decisionEmail } from '@/lib/membership/emails';
import { msg } from '@/lib/nav/model';
import { PermissionError, requirePermission } from '@/lib/permissions/server';
import { createClient } from '@/lib/supabase/server';

/**
 * Staff review of membership applications (actions adm.app.open, adm.doc.ok, adm.doc.reject, adm.check, adm.edit,
 * adm.cls, adm.return, adm.verify, adm.reject; docs/06 levels in module 'mem'). Each action checks the officer first
 * (requirePermission: active staff, 2-step session, level), then calls the api.* function of migration 0310 with the
 * officer's own session — it checks the level and the stage again, writes history, the applicant's portal message and
 * the audit reason. Emails are sent after the decision is saved; their outcome is recorded (api.email_mark), so a
 * failed email never undoes a decision.
 */

export interface ReviewResult {
  ok: boolean;
  message: string;
}

const uuid = z.string().uuid();
const reason = z.string().trim().min(1).max(1000);
// No revalidatePath: the review pages are force-dynamic (always rendered fresh) and the screen shows the confirmed
// result itself, then refreshes. Revalidating made every action answer carry a whole re-rendered page.
const refresh = () => {};

function fail(locale: Locale, error: unknown, what: string): ReviewResult {
  if (error instanceof PermissionError) return { ok: false, message: msg(locale, 'review.errors.notAllowed') };
  if (error instanceof z.ZodError) return { ok: false, message: msg(locale, 'review.errors.reason') };
  const e = error as { code?: string; hint?: string; message?: string };
  if (e?.code === '42501') return { ok: false, message: msg(locale, 'review.errors.notAllowed') };
  if (e?.code === 'P0001') {
    const key =
      e.hint === 'wrong_stage'
        ? 'review.errors.wrongStage'
        : e.hint === 'reason_required'
          ? 'review.errors.reason'
          : e.hint === 'incomplete'
            ? 'review.errors.incomplete'
            : e.hint === 'documents'
              ? 'review.desk.verifyBlockedDocs'
              : e.hint === 'checklist'
                ? 'review.desk.verifyBlockedChecks'
                : e.hint === 'field'
                  ? 'review.errors.field'
                  : e.hint && ['member_no', 'member_no_class', 'member_no_used', 'endorsements'].includes(e.hint)
                    ? `review.forward.errors.${e.hint}`
                    : null;
    if (key) return { ok: false, message: msg(locale, key) };
  }
  console.error(`${what} failed`, e?.code, e?.message);
  return { ok: false, message: msg(locale, 'review.errors.generic') };
}

/** sends the decision email that the database queued, and records whether it went */
async function deliver(
  kind: Decision,
  row: { email_id: number; to_email: string; name: string | null; token: string } | undefined,
  note: string | null,
): Promise<boolean> {
  if (!row?.email_id) return false;
  const supabase = await createClient();
  try {
    const id = await sendEmail(decisionEmail(kind, row.to_email, row.name ?? '', row.token, note));
    await supabase.schema('api').rpc('email_mark', { p_email: row.email_id, p_ok: true, p_provider_id: id });
    return true;
  } catch (error) {
    const reasonText = (error as Error)?.message?.slice(0, 200) ?? 'not sent';
    await supabase.schema('api').rpc('email_mark', { p_email: row.email_id, p_ok: false, p_error: reasonText });
    console.error(`${kind} email not sent`, (error as Error)?.name);
    return false;
  }
}

export async function startReview(locale: Locale, appId: string): Promise<ReviewResult> {
  try {
    await requirePermission('mem', 2);
    const supabase = await createClient();
    const { error } = await supabase.schema('api').rpc('app_open', { p_app: uuid.parse(appId) });
    if (error) throw error;
    refresh();
    return { ok: true, message: msg(locale, 'review.done.opened') };
  } catch (error) {
    return fail(locale, error, 'adm.app.open');
  }
}

export async function reviewDocument(
  locale: Locale,
  documentId: string,
  ok: boolean,
  why?: string,
): Promise<ReviewResult> {
  try {
    await requirePermission('mem', 2);
    const supabase = await createClient();
    const { error } = await supabase.schema('api').rpc('doc_review', {
      p_document: uuid.parse(documentId),
      p_ok: ok,
      ...(ok ? {} : { p_reason: reason.parse(why ?? '') }),
    });
    if (error) throw error;
    refresh();
    return { ok: true, message: msg(locale, ok ? 'review.done.docOk' : 'review.done.docRejected') };
  } catch (error) {
    return fail(locale, error, ok ? 'adm.doc.ok' : 'adm.doc.reject');
  }
}

const CHECKS = ['docs', 'identity', 'ntn', 'address', 'proposers'] as const;

export async function setCheck(locale: Locale, appId: string, item: string, on: boolean): Promise<ReviewResult> {
  try {
    await requirePermission('mem', 2);
    const supabase = await createClient();
    const { error } = await supabase
      .schema('api')
      .rpc('app_check', { p_app: uuid.parse(appId), p_item: z.enum(CHECKS).parse(item), p_on: on });
    if (error) throw error;
    refresh();
    return { ok: true, message: msg(locale, 'review.done.saved') };
  } catch (error) {
    return fail(locale, error, 'adm.check');
  }
}

const FIELDS = [
  'name',
  'address',
  'ntn',
  'gst',
  'tel',
  'fax',
  'email',
  'web',
  'particulars',
  'est',
  'rep',
  'desig',
  'cnic',
  'mobile',
] as const;

export async function correctField(
  locale: Locale,
  appId: string,
  field: string,
  value: string,
  why: string,
): Promise<ReviewResult> {
  try {
    await requirePermission('mem', 2);
    const supabase = await createClient();
    const { error } = await supabase.schema('api').rpc('app_edit_field', {
      p_app: uuid.parse(appId),
      p_field: z.enum(FIELDS).parse(field),
      p_value: z.string().max(600).parse(value),
      p_reason: reason.parse(why),
    });
    if (error) throw error;
    refresh();
    return { ok: true, message: msg(locale, 'review.done.saved') };
  } catch (error) {
    return fail(locale, error, 'adm.edit');
  }
}

export async function setClass(locale: Locale, appId: string, cls: string, why: string): Promise<ReviewResult> {
  try {
    await requirePermission('mem', 3);
    const supabase = await createClient();
    const { error } = await supabase.schema('api').rpc('app_set_class', {
      p_app: uuid.parse(appId),
      p_class: z.enum(['Corporate', 'Associate']).parse(cls),
      p_reason: reason.parse(why),
    });
    if (error) throw error;
    refresh();
    return { ok: true, message: msg(locale, 'review.done.saved') };
  } catch (error) {
    return fail(locale, error, 'adm.cls');
  }
}

export async function returnApplication(locale: Locale, appId: string, note: string): Promise<ReviewResult> {
  try {
    await requirePermission('mem', 2);
    const text = reason.parse(note);
    const supabase = await createClient();
    const { data, error } = await supabase.schema('api').rpc('app_return', { p_app: uuid.parse(appId), p_note: text });
    if (error) throw error;
    refresh();
    const sent = await deliver('returned', data?.[0], text);
    return { ok: true, message: msg(locale, sent ? 'review.done.returned' : 'review.done.emailFailed') };
  } catch (error) {
    return fail(locale, error, 'adm.return');
  }
}

export async function verifyApplication(locale: Locale, appId: string): Promise<ReviewResult> {
  try {
    await requirePermission('mem', 2);
    const supabase = await createClient();
    const { data, error } = await supabase.schema('api').rpc('app_verify', { p_app: uuid.parse(appId) });
    if (error) throw error;
    refresh();
    const sent = await deliver('verified', data?.[0], null);
    return { ok: true, message: msg(locale, sent ? 'review.done.verified' : 'review.done.emailFailed') };
  } catch (error) {
    return fail(locale, error, 'adm.verify');
  }
}

export async function rejectApplication(locale: Locale, appId: string, why: string): Promise<ReviewResult> {
  try {
    await requirePermission('mem', 3);
    const text = reason.parse(why);
    const supabase = await createClient();
    const { data, error } = await supabase
      .schema('api')
      .rpc('app_reject', { p_app: uuid.parse(appId), p_reason: text });
    if (error) throw error;
    refresh();
    const sent = await deliver('rejected', data?.[0], text);
    return { ok: true, message: msg(locale, sent ? 'review.done.rejected' : 'review.done.emailFailed') };
  } catch (error) {
    return fail(locale, error, 'adm.reject');
  }
}

/** adm.forward: the Membership Officer types the membership number (C-201 / A-786) and forwards to the committee */
export async function forwardToCommittee(locale: Locale, appId: string, memberNo: string): Promise<ReviewResult> {
  try {
    await requirePermission('mem', 2);
    const no = z.string().trim().min(1).max(20).safeParse(memberNo);
    if (!no.success) return { ok: false, message: msg(locale, 'review.forward.errors.member_no') };
    const supabase = await createClient();
    const { data, error } = await supabase.schema('api').rpc('app_forward', { p_app: uuid.parse(appId), p_member_no: no.data });
    if (error) throw error;
    refresh();
    return { ok: true, message: msg(locale, 'review.forward.done', { no: data ?? '' }) };
  } catch (error) {
    return fail(locale, error, 'adm.forward');
  }
}
