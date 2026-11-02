'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { asLocale } from '@/i18n/locale';
import type { Locale } from '@/i18n/routing';
import { msg } from '@/lib/nav/model';
import { PermissionError, requirePermission } from '@/lib/permissions/server';
import { createClient } from '@/lib/supabase/server';
import { parseRupees } from './statement';

/**
 * Accounts: fin ≥ 2 records, fin ≥ 3 verifies, voids and closes a month. The database checks all of it again; the person
 * who recorded an entry cannot verify it. Every change is audited by the row triggers with the reason given here.
 */
export interface FinResult {
  ok: boolean;
  message: string;
}

const KNOWN = [
  'amount',
  'date',
  'account',
  'bank',
  'attachment',
  'state',
  'own_entry',
  'month_closed',
  'reason_required',
  'fields',
  'exists',
];
const refresh = () => revalidatePath('/[locale]/admin/finance', 'page');
const done = (locale: Locale, key: string, v?: Record<string, string>): FinResult => ({
  ok: true,
  message: msg(locale, `fin.done.${key}`, v),
});

function fail(locale: Locale, error: unknown, what: string): FinResult {
  if (error instanceof PermissionError) return { ok: false, message: msg(locale, 'fin.errors.notAllowed') };
  if (error instanceof z.ZodError) return { ok: false, message: msg(locale, 'fin.errors.fields') };
  const e = error as { code?: string; hint?: string; message?: string };
  if (e?.code === '42501') return { ok: false, message: msg(locale, 'fin.errors.notAllowed') };
  if (e?.code === 'P0001' && e.hint && KNOWN.includes(e.hint)) return { ok: false, message: msg(locale, `fin.errors.${e.hint}`) };
  console.error(`${what} failed`, e?.code, e?.message);
  return { ok: false, message: msg(locale, 'fin.errors.generic') };
}

const uuid = z.string().uuid();
const day = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const reason = z.string().trim().min(3).max(1000);
const text = (form: FormData, k: string) => String(form.get(k) ?? '').trim();

export async function addEntry(form: FormData): Promise<FinResult> {
  const locale = asLocale(String(form.get('locale') ?? 'en'));
  try {
    await requirePermission('fin', 2);
    const paisa = parseRupees(text(form, 'amount'));
    if (paisa === null) return { ok: false, message: msg(locale, 'fin.errors.amount') };
    const account = uuid.parse(text(form, 'account'));
    const on = day.parse(text(form, 'date'));
    const bank = text(form, 'bank');
    const db = await createClient();
    const { data, error } = await db.schema('api').rpc('fin_entry_add', {
      p_account: account,
      p_paisa: paisa,
      p_date: on,
      p_bank: (bank ? uuid.parse(bank) : null) as string,
      p_party: text(form, 'party').slice(0, 200),
      p_reference: text(form, 'reference').slice(0, 120),
      p_note: text(form, 'note').slice(0, 1000),
      p_path: (text(form, 'path') || null) as string,
      p_name: (text(form, 'pathName') || null) as string,
    });
    if (error) throw error;
    refresh();
    return done(locale, 'entry', { no: data ?? '' });
  } catch (error) {
    return fail(locale, error, 'fin.add');
  }
}

export async function verifyEntry(locale: Locale, id: string): Promise<FinResult> {
  try {
    await requirePermission('fin', 3);
    const db = await createClient();
    const { error } = await db.schema('api').rpc('fin_entry_verify', { p_id: uuid.parse(id) });
    if (error) throw error;
    refresh();
    return done(locale, 'verified');
  } catch (error) {
    return fail(locale, error, 'fin.verify');
  }
}

export async function voidEntry(locale: Locale, id: string, why: string): Promise<FinResult> {
  try {
    await requirePermission('fin', 3);
    const db = await createClient();
    const r = reason.safeParse(why);
    if (!r.success) return { ok: false, message: msg(locale, 'fin.errors.reason_required') };
    const { error } = await db.schema('api').rpc('fin_entry_void', { p_id: uuid.parse(id), p_reason: r.data });
    if (error) throw error;
    refresh();
    return done(locale, 'voided');
  } catch (error) {
    return fail(locale, error, 'fin.void');
  }
}

export async function addAccount(form: FormData): Promise<FinResult> {
  const locale = asLocale(String(form.get('locale') ?? 'en'));
  try {
    await requirePermission('fin', 3);
    const db = await createClient();
    const { error } = await db.schema('api').rpc('fin_account_add', {
      p_group: text(form, 'group'),
      p_name: text(form, 'name').slice(0, 200),
      p_name_ur: text(form, 'name_ur').slice(0, 200),
    });
    if (error) throw error;
    refresh();
    return done(locale, 'account');
  } catch (error) {
    return fail(locale, error, 'fin.account');
  }
}

/** a balance may be negative only on the books; a bank's own statement figure can be, so this one takes a sign */
function signedPaisa(raw: string): number | null {
  const s = raw.trim();
  const negative = s.startsWith('-') || s.startsWith('(');
  const p = s === '0' ? 0 : parseRupees(s.replace(/^[-(]/, '').replace(/\)$/, ''));
  return p === null ? null : negative ? -p : p;
}

export async function saveBankBalance(form: FormData): Promise<FinResult> {
  const locale = asLocale(String(form.get('locale') ?? 'en'));
  try {
    await requirePermission('fin', 2);
    const paisa = signedPaisa(text(form, 'balance'));
    if (paisa === null) return { ok: false, message: msg(locale, 'fin.errors.amount') };
    const month = z.string().regex(/^\d{4}-\d{2}$/).parse(text(form, 'month'));
    const db = await createClient();
    const { error } = await db.schema('api').rpc('fin_bank_balance_save', {
      p_bank: uuid.parse(text(form, 'bank')),
      p_month: `${month}-01`,
      p_paisa: paisa,
      p_note: text(form, 'note').slice(0, 500),
    });
    if (error) throw error;
    refresh();
    return done(locale, 'balance');
  } catch (error) {
    return fail(locale, error, 'fin.balance');
  }
}

export async function saveOpening(form: FormData): Promise<FinResult> {
  const locale = asLocale(String(form.get('locale') ?? 'en'));
  try {
    await requirePermission('fin', 3);
    const paisa = signedPaisa(text(form, 'opening'));
    if (paisa === null) return { ok: false, message: msg(locale, 'fin.errors.amount') };
    const db = await createClient();
    const { error } = await db.schema('api').rpc('fin_bank_opening_save', {
      p_bank: uuid.parse(text(form, 'bank')),
      p_paisa: paisa,
      p_opening_on: day.parse(text(form, 'openingOn')),
      p_reason: reason.parse(text(form, 'reason')),
    });
    if (error) throw error;
    refresh();
    return done(locale, 'opening');
  } catch (error) {
    return fail(locale, error, 'fin.opening');
  }
}

export async function setMonth(form: FormData): Promise<FinResult> {
  const locale = asLocale(String(form.get('locale') ?? 'en'));
  try {
    await requirePermission('fin', 3);
    const month = z.string().regex(/^\d{4}-\d{2}$/).parse(text(form, 'month'));
    const closed = text(form, 'closed') === '1';
    const db = await createClient();
    const { error } = await db.schema('api').rpc('fin_month_set', {
      p_month: `${month}-01`,
      p_closed: closed,
      p_note: reason.parse(text(form, 'note')),
    });
    if (error) throw error;
    refresh();
    return done(locale, closed ? 'closed' : 'reopened', { month });
  } catch (error) {
    return fail(locale, error, 'fin.month');
  }
}
