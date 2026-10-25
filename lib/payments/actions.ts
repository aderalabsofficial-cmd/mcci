'use server';

import { createHash } from 'node:crypto';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import type { Locale } from '@/i18n/routing';
import { asLocale } from '@/i18n/locale';
import { pkr, voucherDate } from '@/lib/committee/voucher';
import { bilingualEmail } from '@/lib/email/bilingual';
import { sendEmail } from '@/lib/email/send';
import { checkUpload, EXT, MIME } from '@/lib/files/sniff';
import { msg } from '@/lib/nav/model';
import { PermissionError, requirePermission, requireUser } from '@/lib/permissions/server';
import { createClient } from '@/lib/supabase/server';

/**
 * Payments (actions pay.upload, pay.verify, pay.reject, psid.markpaid, psid.cancel, psid.gen, settings.save for the bank
 * account; docs/06: pay ≥ 2, bank plat ≥ 2, member company area pay ≥ 2). Each action checks the person first, then
 * calls the api.* function of migration 0340 with their own session — it re-checks level, voucher state and, for
 * receipts, that MCCI has confirmed the bank account. A verified membership voucher issues the temporary membership
 * in the same database call. Emails go after the change is saved; their outcome is recorded (api.email_mark).
 */

export interface PayResult {
  ok: boolean;
  message: string;
}

type Mailed = {
  email_id: number | null;
  to_email: string | null;
  name: string | null;
  voucher_no?: string | null;
  amount?: number | null;
  temp_code?: string | null;
  member_no?: string | null;
  expires_at?: string | null;
};

const voucherNo = z.string().regex(/^PV-\d{4}-\d{4,}$/);
const reason = z.string().trim().min(3).max(500);
const refresh = () => {
  for (const p of ['admin/payments', 'admin/psid', 'admin/temp', 'admin/documents', 'admin', 'portal/payments', 'portal', 'portal/documents', 'portal/membership'])
    revalidatePath(`/[locale]/${p}`, 'page');
};

function fail(locale: Locale, error: unknown, what: string): PayResult {
  const t = (k: string) => msg(locale, `pay.errors.${k}`);
  if (error instanceof PermissionError) return { ok: false, message: t('notAllowed') };
  if (error instanceof z.ZodError) return { ok: false, message: t('fields') };
  const e = error as { code?: string; hint?: string; message?: string };
  if (e?.code === '42501') return { ok: false, message: t('notAllowed') };
  const known = ['bank_pending', 'wrong_status', 'file', 'reason_required', 'reference', 'not_found', 'live_exists', 'iban', 'required', 'wrong_stage', 'not_paid'];
  if (e?.code === 'P0001' && e.hint && known.includes(e.hint)) return { ok: false, message: t(e.hint) };
  console.error(`${what} failed`, e?.code, e?.message);
  return { ok: false, message: t('generic') };
}

/** the email the database queued: payment_receipt_received / payment_rejected / payment_verified / temp_issued */
async function deliver(template: string, row: Mailed | undefined, extra: Record<string, string> = {}): Promise<boolean> {
  if (!row?.email_id || !row.to_email) return false;
  const supabase = await createClient();
  const vars = {
    voucher: row.voucher_no ?? '',
    amount: row.amount != null ? pkr(row.amount) : '',
    no: row.member_no ?? '',
    code: row.temp_code ?? '',
    until: row.expires_at ? voucherDate(row.expires_at, 'en') : '',
    ...extra,
  };
  const spec: Record<string, { subject: string; paragraphs: string[]; path: string; label: string }> = {
    payment_receipt_received: { subject: 'pay.email.receivedSubject', paragraphs: ['pay.email.receivedBody'], path: '/portal/payments', label: 'pay.email.openPayments' },
    payment_rejected: { subject: 'pay.email.rejectedSubject', paragraphs: ['pay.email.rejectedBody'], path: '/portal/payments', label: 'pay.email.openPayments' },
    payment_verified: { subject: 'pay.email.verifiedSubject', paragraphs: ['pay.email.verifiedBody'], path: '/portal/payments', label: 'pay.email.openPayments' },
    temp_issued: { subject: 'pay.email.tempSubject', paragraphs: ['pay.email.verifiedBody', 'pay.email.tempBody'], path: '/portal/documents', label: 'pay.email.openDocuments' },
  };
  const s = spec[template]!;
  try {
    const id = await sendEmail(
      bilingualEmail({
        to: row.to_email,
        name: row.name,
        subject: s.subject,
        paragraphs: s.paragraphs,
        vars,
        quote: extra.reason ?? null,
        action: { label: s.label, path: s.path },
      }),
    );
    await supabase.schema('api').rpc('email_mark', { p_email: row.email_id, p_ok: true, p_provider_id: id });
    return true;
  } catch (error) {
    await supabase
      .schema('api')
      .rpc('email_mark', { p_email: row.email_id, p_ok: false, p_error: (error as Error)?.message?.slice(0, 200) ?? 'not sent' });
    console.error(`${template} email not sent`, (error as Error)?.name);
    return false;
  }
}

const done = (locale: Locale, key: string, sent: boolean, vars: Record<string, string> = {}): PayResult => {
  const message = msg(locale, `pay.done.${key}`, vars);
  return { ok: true, message: sent ? message : `${message} ${msg(locale, 'pay.done.emailFailed')}` };
};

/** pay.upload: the member's photo / PDF of the paid bank slip, stored privately, then handed to Accounts */
export async function uploadReceipt(form: FormData): Promise<PayResult> {
  const locale = asLocale(String(form.get('locale') ?? 'en'));
  try {
    await requireUser();
    const no = voucherNo.parse(form.get('voucher'));
    const bankRef = z.string().trim().max(80).parse(form.get('bankRef') ?? '');
    const file = form.get('file');
    if (!(file instanceof File)) return { ok: false, message: msg(locale, 'pay.errors.file') };
    const bytes = new Uint8Array(await file.arrayBuffer());
    const check = checkUpload(bytes, ['jpeg', 'png', 'pdf', 'heic']);
    if ('problem' in check) return { ok: false, message: msg(locale, `membership.errors.upload.${check.problem}`) };
    const kind = check.kind;
    const supabase = await createClient();
    const { data: v } = await supabase.from('payment_vouchers').select('id, company_id').eq('voucher_no', no).maybeSingle();
    if (!v) return { ok: false, message: msg(locale, 'pay.errors.notAllowed') };
    const path = `${v.company_id}/vouchers/${v.id}/${Date.now()}-receipt.${EXT[kind]}`;
    const up = await supabase.storage.from('receipts').upload(path, bytes, { contentType: MIME[kind], upsert: false });
    if (up.error) {
      // the storage policy refuses when the voucher takes no receipt or the bank account is not confirmed
      const { data: bank } = await supabase.schema('api').rpc('voucher_view', { p_voucher: no });
      const confirmed = (bank?.[0]?.bank as { confirmed?: boolean } | null)?.confirmed === true;
      return { ok: false, message: msg(locale, confirmed ? 'pay.errors.wrong_status' : 'pay.errors.bank_pending') };
    }
    const sha = createHash('sha256').update(bytes).digest('hex');
    const { data, error } = await supabase
      .schema('api')
      .rpc('pay_upload', { p_voucher: no, p_path: path, p_sha256: sha, p_bank_ref: bankRef || undefined });
    if (error) throw error;
    refresh();
    const sent = await deliver('payment_receipt_received', data?.[0] as Mailed | undefined);
    return done(locale, 'uploaded', sent, { voucher: no });
  } catch (error) {
    return fail(locale, error, 'pay.upload');
  }
}

export async function verifyPayment(locale: Locale, voucher: string): Promise<PayResult> {
  try {
    await requirePermission('pay', 2);
    const supabase = await createClient();
    const { data, error } = await supabase.schema('api').rpc('pay_verify', { p_voucher: voucherNo.parse(voucher) });
    if (error) throw error;
    refresh();
    const row = data?.[0] as Mailed | undefined;
    const sent = await deliver(row?.temp_code ? 'temp_issued' : 'payment_verified', row);
    return done(locale, row?.temp_code ? 'verifiedTemp' : 'verified', sent, { voucher, no: row?.member_no ?? '' });
  } catch (error) {
    return fail(locale, error, 'pay.verify');
  }
}

export async function counterPayment(locale: Locale, voucher: string, ref: string, note: string): Promise<PayResult> {
  try {
    await requirePermission('pay', 2);
    const r = z.string().trim().min(2).max(80).safeParse(ref);
    if (!r.success) return { ok: false, message: msg(locale, 'pay.errors.reference') };
    const supabase = await createClient();
    const { data, error } = await supabase.schema('api').rpc('pay_counter', {
      p_voucher: voucherNo.parse(voucher),
      p_ref: r.data,
      p_note: z.string().trim().max(500).parse(note) || undefined,
    });
    if (error) throw error;
    refresh();
    const row = data?.[0] as Mailed | undefined;
    const sent = await deliver(row?.temp_code ? 'temp_issued' : 'payment_verified', row);
    return done(locale, row?.temp_code ? 'verifiedTemp' : 'verified', sent, { voucher, no: row?.member_no ?? '' });
  } catch (error) {
    return fail(locale, error, 'psid.markpaid');
  }
}

export async function rejectPayment(locale: Locale, voucher: string, why: string): Promise<PayResult> {
  try {
    await requirePermission('pay', 2);
    const text = reason.safeParse(why);
    if (!text.success) return { ok: false, message: msg(locale, 'pay.errors.reason_required') };
    const supabase = await createClient();
    const { data, error } = await supabase
      .schema('api')
      .rpc('pay_reject', { p_voucher: voucherNo.parse(voucher), p_reason: text.data });
    if (error) throw error;
    refresh();
    const sent = await deliver('payment_rejected', data?.[0] as Mailed | undefined, { reason: text.data });
    return done(locale, 'rejected', sent, { voucher });
  } catch (error) {
    return fail(locale, error, 'pay.reject');
  }
}

export async function cancelVoucher(locale: Locale, voucher: string, why: string): Promise<PayResult> {
  try {
    await requirePermission('pay', 2);
    const text = reason.safeParse(why);
    if (!text.success) return { ok: false, message: msg(locale, 'pay.errors.reason_required') };
    const supabase = await createClient();
    const { error } = await supabase
      .schema('api')
      .rpc('voucher_cancel', { p_voucher: voucherNo.parse(voucher), p_reason: text.data });
    if (error) throw error;
    refresh();
    return { ok: true, message: msg(locale, 'pay.done.cancelled', { voucher }) };
  } catch (error) {
    return fail(locale, error, 'psid.cancel');
  }
}

export async function reissueVoucher(locale: Locale, voucher: string): Promise<PayResult> {
  try {
    await requirePermission('pay', 2);
    const supabase = await createClient();
    const { data, error } = await supabase.schema('api').rpc('voucher_reissue', { p_voucher: voucherNo.parse(voucher) });
    if (error) throw error;
    refresh();
    return { ok: true, message: msg(locale, 'pay.done.reissued', { voucher: String(data ?? '') }) };
  } catch (error) {
    return fail(locale, error, 'psid.gen');
  }
}

/** settings.save (plat ≥ 2): MCCI's bank account on vouchers; "confirmed" opens receipt uploads (docs/14 item 4) */
export async function saveBank(form: FormData): Promise<PayResult> {
  const locale = asLocale(String(form.get('locale') ?? 'en'));
  try {
    await requirePermission('plat', 2);
    const p = z
      .object({
        bank: z.string().trim().min(2).max(120),
        title: z.string().trim().min(2).max(160),
        iban: z.string().trim().min(10).max(40),
        branch: z.string().trim().max(120),
        confirmed: z.boolean(),
      })
      .parse({
        bank: form.get('bank'),
        title: form.get('title'),
        iban: form.get('iban'),
        branch: form.get('branch') ?? '',
        confirmed: form.get('confirmed') === 'on',
      });
    const supabase = await createClient();
    const { error } = await supabase.schema('api').rpc('settings_bank_save', {
      p_bank: p.bank,
      p_title: p.title,
      p_iban: p.iban,
      p_branch: p.branch,
      p_confirmed: p.confirmed,
    });
    if (error) throw error;
    refresh();
    return { ok: true, message: msg(locale, p.confirmed ? 'pay.done.bankConfirmed' : 'pay.done.bankSaved') };
  } catch (error) {
    return fail(locale, error, 'settings.save');
  }
}
