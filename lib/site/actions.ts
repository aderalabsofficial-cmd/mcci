'use server';

import { headers } from 'next/headers';
import { z } from 'zod';
import { asLocale } from '@/i18n/locale';
import { bilingualEmail } from '@/lib/email/bilingual';
import { sendEmail } from '@/lib/email/send';
import { trustedClientIp } from '@/lib/net/client-ip';
import { msg } from '@/lib/nav/model';
import { createTicket } from '@/lib/site/admin';

/**
 * contact.send (prototype site/contact): the contact form and the complaint desk create a ticket for the Secretariat
 * (docs/05 M2). Public, so: fixed fields with limits, a hidden field bots fill in, 5 tickets an hour per address.
 * The confirmation email carries only the ticket number — never the visitor's own text.
 */

export interface ContactResult {
  ok: boolean;
  message: string;
  ticket?: string;
}

const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

const schema = z.object({
  kind: z.enum(['contact', 'complaint']),
  name: z.string().trim().min(2).max(120),
  contact: z.string().trim().min(5).max(160),
  subject: z.string().trim().max(200).default(''),
  ref: z.string().trim().max(40).default(''),
  category: z.enum(['', 'delay', 'staff', 'document', 'other']).default(''),
  body: z.string().trim().min(5).max(4000),
});

const CATEGORY: Record<string, string> = { delay: 'Service delay', staff: 'Staff conduct', document: 'Document issue', other: 'Other' };

export async function sendContact(form: FormData): Promise<ContactResult> {
  const locale = asLocale(String(form.get('locale') ?? 'en'));
  const m = (k: string, v?: Record<string, string>) => msg(locale, `site.contact.${k}`, v);
  // a field people never see: only bots fill it in; they get the same answer as a person, and nothing is stored
  if (String(form.get('website') ?? '') !== '') return { ok: true, message: m('sent', { ticket: '—' }) };
  const parsed = schema.safeParse({
    kind: form.get('kind'),
    name: form.get('name'),
    contact: form.get('contact'),
    subject: form.get('subject') ?? '',
    ref: form.get('ref') ?? '',
    category: form.get('category') ?? '',
    body: form.get('body'),
  });
  if (!parsed.success) return { ok: false, message: m('errors.fields') };
  const d = parsed.data;
  try {
    const created = await createTicket(
      { ...d, category: CATEGORY[d.category] ?? '' },
      trustedClientIp(await headers()) ?? 'unknown',
    );
    if (created === 'limited') return { ok: false, message: m('errors.limited') };
    let mailed = false;
    if (EMAIL.test(d.contact)) {
      try {
        await sendEmail(
          bilingualEmail({
            to: d.contact.toLowerCase(),
            name: d.name,
            subject: 'site.contact.email.subject',
            paragraphs: [d.kind === 'complaint' ? 'site.contact.email.complaint' : 'site.contact.email.contact', 'site.contact.email.reply'],
            vars: { ticket: created.ticket },
            quote: created.ticket,
          }),
        );
        mailed = true;
      } catch (error) {
        console.error('contact email not sent', (error as Error)?.name);
      }
    }
    return { ok: true, ticket: created.ticket, message: m(mailed ? 'sentMailed' : 'sent', { ticket: created.ticket }) };
  } catch (error) {
    console.error('contact.send failed', (error as { code?: string })?.code);
    return { ok: false, message: m('errors.generic') };
  }
}
