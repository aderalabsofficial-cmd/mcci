'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import type { Locale } from '@/i18n/routing';
import { asLocale } from '@/i18n/locale';
import { voucherDate } from '@/lib/committee/voucher';
import { bilingualEmail } from '@/lib/email/bilingual';
import { sendEmail } from '@/lib/email/send';
import { msg } from '@/lib/nav/model';
import { PermissionError, requireCompanyPermission, requirePermission, requireUser } from '@/lib/permissions/server';
import { createClient } from '@/lib/supabase/server';

/**
 * Engagement (M8 part 1, migration 0390): messages read state, events and registration, help tickets and the
 * complaint desk, website content. Every step is checked again in the database; emails go after the change is saved
 * and their outcome is recorded (api.email_mark).
 */

export interface EngResult {
  ok: boolean;
  message: string;
  id?: string;
}

const uuid = z.string().uuid();

function fail(locale: Locale, error: unknown, what: string): EngResult {
  const t = (k: string) => msg(locale, `eng.errors.${k}`);
  if (error instanceof PermissionError) return { ok: false, message: t('notAllowed') };
  if (error instanceof z.ZodError) return { ok: false, message: t('fields') };
  const e = error as { code?: string; hint?: string; message?: string };
  if (e?.code === '42501') return { ok: false, message: t('notAllowed') };
  const known = ['fields', 'not_found', 'seats', 'past', 'already', 'full', 'closed', 'staff'];
  if (e?.code === 'P0001' && e.hint && known.includes(e.hint)) return { ok: false, message: t(e.hint) };
  console.error(`${what} failed`, e?.code, e?.message);
  return { ok: false, message: t('generic') };
}

const refresh = (...pages: string[]) => {
  for (const p of pages) revalidatePath(`/[locale]/${p}`, 'page');
};

type Mailed = { email_id: number | null; to_email: string | null; name: string | null };

async function deliver(
  row: Mailed | undefined,
  subject: string,
  paragraphs: string[],
  vars: Record<string, string>,
  path: string,
  quote: string | null = null,
) {
  if (!row?.email_id || !row.to_email) return true;
  const supabase = await createClient();
  try {
    const id = await sendEmail(
      bilingualEmail({
        to: row.to_email,
        name: row.name,
        subject,
        paragraphs,
        vars,
        quote,
        action: { label: 'eng.email.open', path },
      }),
    );
    await supabase.schema('api').rpc('email_mark', { p_email: row.email_id, p_ok: true, p_provider_id: id });
    return true;
  } catch (error) {
    await supabase
      .schema('api')
      .rpc('email_mark', {
        p_email: row.email_id,
        p_ok: false,
        p_error: (error as Error)?.message?.slice(0, 200) ?? 'not sent',
      });
    console.error(`${subject} email not sent`, (error as Error)?.name);
    return false;
  }
}

const done = (locale: Locale, key: string, vars: Record<string, string> = {}, mailed = true): EngResult => {
  const m = msg(locale, `eng.done.${key}`, vars);
  return { ok: true, message: mailed ? m : `${m} ${msg(locale, 'eng.done.emailFailed')}` };
};

// ───────── messages ─────────

export async function readNote(locale: Locale, id: string): Promise<EngResult> {
  try {
    await requireUser();
    const supabase = await createClient();
    const { error } = await supabase.schema('api').rpc('note_read', { p_note: uuid.parse(id) });
    if (error) throw error;
    refresh('portal/notifications', 'portal');
    return { ok: true, message: '' };
  } catch (error) {
    return fail(locale, error, 'note.open');
  }
}

export async function readAllNotes(locale: Locale): Promise<EngResult> {
  try {
    await requireUser();
    const supabase = await createClient();
    const { data, error } = await supabase.schema('api').rpc('note_read_all');
    if (error) throw error;
    refresh('portal/notifications', 'portal');
    return done(locale, 'readAll', { n: String(data ?? 0) });
  } catch (error) {
    return fail(locale, error, 'note.readall');
  }
}

// ───────── events ─────────

const eventSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().trim().min(3).max(200),
  title_ur: z.string().trim().max(200).default(''),
  type: z.string().trim().max(60).default(''),
  starts_at: z.string().min(10),
  venue: z.string().trim().max(200).default(''),
  seats: z.string().trim().default(''),
  body: z.string().trim().max(8000).default(''),
  body_ur: z.string().trim().max(8000).default(''),
  published: z.boolean(),
});

/** ev.create / ev.edit (eng ≥ 2): the date and time are entered in Pakistan time */
export async function saveEvent(form: FormData): Promise<EngResult> {
  const locale = asLocale(String(form.get('locale') ?? 'en'));
  try {
    await requirePermission('eng', 2);
    const d = eventSchema.parse({
      id: form.get('id') || undefined,
      title: form.get('title'),
      title_ur: form.get('title_ur') ?? '',
      type: form.get('type') ?? '',
      starts_at: form.get('starts_at'),
      venue: form.get('venue') ?? '',
      seats: form.get('seats') ?? '',
      body: form.get('body') ?? '',
      body_ur: form.get('body_ur') ?? '',
      published: form.get('published') === 'on',
    });
    const starts = new Date(`${d.starts_at}:00+05:00`);
    if (Number.isNaN(starts.getTime())) return { ok: false, message: msg(locale, 'eng.errors.fields') };
    const seats = d.seats === '' ? null : Number(d.seats);
    const supabase = await createClient();
    const { data, error } = await supabase.schema('api').rpc('ev_save', {
      p_id: d.id ?? (null as unknown as string),
      p_title: d.title,
      p_title_ur: d.title_ur,
      p_type: d.type,
      p_starts_at: starts.toISOString(),
      p_venue: d.venue,
      p_seats: seats as number,
      p_body: d.body,
      p_body_ur: d.body_ur,
      p_published: d.published,
    });
    if (error) throw error;
    refresh('admin/events', 'portal/events', '(site)/news');
    return { ...done(locale, d.id ? 'eventSaved' : 'eventCreated', { title: d.title }), id: data ?? undefined };
  } catch (error) {
    return fail(locale, error, 'ev.save');
  }
}

/** event.reg: the company registers once while seats last; the person is emailed the confirmation */
export async function registerEvent(locale: Locale, eventId: string, companyId: string): Promise<EngResult> {
  try {
    await requireCompanyPermission(uuid.parse(companyId), 'events', 2);
    const supabase = await createClient();
    const { data, error } = await supabase
      .schema('api')
      .rpc('event_register', { p_event: uuid.parse(eventId), p_company: companyId });
    if (error) throw error;
    const row = data?.[0];
    refresh('portal/events', 'admin/events');
    const when = row?.starts_at
      ? new Date(row.starts_at).toLocaleString('en-GB', {
          timeZone: 'Asia/Karachi',
          day: 'numeric',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })
      : '';
    const mailed = await deliver(
      row,
      'eng.email.eventSubject',
      ['eng.email.eventBody'],
      { title: row?.title ?? '', when, venue: row?.venue ?? '' },
      '/portal/events',
      row?.ticket_code ?? null,
    );
    return done(locale, 'registered', { title: row?.title ?? '' }, mailed);
  } catch (error) {
    return fail(locale, error, 'event.reg');
  }
}

// ───────── tickets ─────────

export async function newTicket(form: FormData): Promise<EngResult> {
  const locale = asLocale(String(form.get('locale') ?? 'en'));
  try {
    await requireUser();
    const company = form.get('company') ? uuid.parse(form.get('company')) : null;
    const subject = z.string().trim().min(3).max(200).safeParse(form.get('subject'));
    const body = z.string().trim().min(5).max(4000).safeParse(form.get('body'));
    if (!subject.success || !body.success) return { ok: false, message: msg(locale, 'eng.errors.fields') };
    const supabase = await createClient();
    const { data, error } = await supabase
      .schema('api')
      .rpc('ticket_new', { p_company: company as string, p_subject: subject.data, p_body: body.data });
    if (error) throw error;
    refresh('portal/support', 'admin/complaints');
    return { ...done(locale, 'ticketOpened', { ticket: data ?? '' }), id: data ?? undefined };
  } catch (error) {
    return fail(locale, error, 'ticket.new');
  }
}

export async function replyTicket(locale: Locale, ticket: string, body: string): Promise<EngResult> {
  try {
    await requireUser();
    const b = z.string().trim().min(1).max(4000).safeParse(body);
    if (!b.success) return { ok: false, message: msg(locale, 'eng.errors.fields') };
    const supabase = await createClient();
    const { data, error } = await supabase
      .schema('api')
      .rpc('ticket_reply', { p_ticket: z.string().max(40).parse(ticket), p_body: b.data });
    if (error) throw error;
    const row = data?.[0];
    refresh('portal/support', 'admin/complaints');
    const mailed = row?.staff
      ? await deliver(
          row,
          'eng.email.replySubject',
          ['eng.email.replyBody'],
          { ticket },
          `/portal/support?t=${ticket}`,
          b.data,
        )
      : true;
    return done(locale, 'replied', {}, mailed);
  } catch (error) {
    return fail(locale, error, 'ticket.reply');
  }
}

export async function assignTicket(locale: Locale, ticket: string, staff: string): Promise<EngResult> {
  try {
    await requirePermission('eng', 2);
    const supabase = await createClient();
    const { error } = await supabase
      .schema('api')
      .rpc('ticket_assign', { p_ticket: z.string().max(40).parse(ticket), p_staff: uuid.parse(staff) });
    if (error) throw error;
    refresh('admin/complaints');
    return done(locale, 'assigned');
  } catch (error) {
    return fail(locale, error, 'tk.assign');
  }
}

export async function resolveTicket(locale: Locale, ticket: string, note: string): Promise<EngResult> {
  try {
    await requirePermission('eng', 2);
    const supabase = await createClient();
    const n = z.string().trim().max(4000).parse(note);
    const { data, error } = await supabase
      .schema('api')
      .rpc('ticket_resolve', { p_ticket: z.string().max(40).parse(ticket), p_note: n });
    if (error) throw error;
    refresh('admin/complaints', 'portal/support');
    const mailed = await deliver(
      data?.[0],
      'eng.email.resolvedSubject',
      ['eng.email.resolvedBody'],
      { ticket },
      `/portal/support?t=${ticket}`,
      n || null,
    );
    return done(locale, 'resolved', {}, mailed);
  } catch (error) {
    return fail(locale, error, 'tk.resolve');
  }
}

// ───────── website content ─────────

export async function savePost(form: FormData): Promise<EngResult> {
  const locale = asLocale(String(form.get('locale') ?? 'en'));
  try {
    await requirePermission('eng', 2);
    const d = z
      .object({
        id: z.string().uuid().optional(),
        category: z.enum(['News', 'Notice', 'Circular', 'Event']),
        title: z.string().trim().min(3).max(200),
        title_ur: z.string().trim().max(200).default(''),
        body: z.string().trim().min(3).max(20000),
        body_ur: z.string().trim().max(20000).default(''),
        status: z.enum(['Draft', 'Live', 'Archived']),
      })
      .parse({
        id: form.get('id') || undefined,
        category: form.get('category'),
        title: form.get('title'),
        title_ur: form.get('title_ur') ?? '',
        body: form.get('body'),
        body_ur: form.get('body_ur') ?? '',
        status: form.get('status'),
      });
    const supabase = await createClient();
    const { data, error } = await supabase.schema('api').rpc('post_save', {
      p_id: d.id ?? (null as unknown as string),
      p_category: d.category,
      p_title: d.title,
      p_title_ur: d.title_ur,
      p_body: d.body,
      p_body_ur: d.body_ur,
      p_status: d.status,
    });
    if (error) throw error;
    refresh('admin/content', '(site)/news', '(site)');
    return {
      ...done(locale, d.status === 'Live' ? 'postLive' : 'postSaved', { title: d.title }),
      id: data ?? undefined,
    };
  } catch (error) {
    return fail(locale, error, 'post.save');
  }
}

// ───────── notification center ─────────

/** tpl.test: a sample of one email template to the staff member's own address */
export async function sendTestEmail(locale: Locale, template: string): Promise<EngResult> {
  try {
    const actor = await requirePermission('eng', 2);
    const { TEMPLATES } = await import('@/lib/engagement/templates');
    const t = TEMPLATES.find((x) => x.key === z.string().max(60).parse(template));
    if (!t) return { ok: false, message: msg(locale, 'eng.errors.not_found') };
    const supabase = await createClient();
    const { data: me } = await supabase.from('profiles').select('email, full_name').eq('id', actor.userId).single();
    if (!me?.email) return { ok: false, message: msg(locale, 'eng.errors.generic') };
    await sendEmail(
      bilingualEmail({
        to: me.email,
        name: me.full_name,
        subject: t.subject,
        paragraphs: t.paragraphs,
        vars: { ...t.sample, date: voucherDate(new Date().toISOString(), 'en') },
        action: { label: 'eng.email.open', path: t.path },
      }),
    );
    return done(locale, 'testSent', { email: me.email });
  } catch (error) {
    return fail(locale, error, 'tpl.test');
  }
}
