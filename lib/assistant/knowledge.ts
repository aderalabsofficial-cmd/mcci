import 'server-only';
import type { Locale } from '@/i18n/routing';
import { loadPublicSettings } from '@/lib/membership/load';
import { msg } from '@/lib/nav/model';
import type { Session } from '@/lib/permissions/server';
import { createClient } from '@/lib/supabase/server';

/**
 * What Ask MCCI AI may know (prototype member/assistant; owner instruction Part 3.1):
 *   1. approved, published MCCI content — chamber contacts, fees, endorsement and processing rules, the seven services,
 *      the document checklist per business type and the membership FAQ (the same texts the website shows);
 *   2. the signed-in member's OWN files only — application tokens and stages, service request references and
 *      statuses — read with the member's own session, so row-level security decides; never documents, notes, other
 *      companies, staff names or committee discussion.
 * Built fresh for every question; nothing here is sent anywhere except the model call in actions.ts.
 */
export async function approvedKnowledge(locale: Locale): Promise<string> {
  const s = await loadPublicSettings();
  const supabase = await createClient();
  const [{ data: services }, { data: reqs }] = await Promise.all([
    supabase.from('service_types').select('key, name_en, fee, sla_hours, active').eq('active', true).order('sort'),
    supabase.from('document_requirements').select('biz_type, label_en, sort').order('sort'),
  ]);
  const f = s.fees;
  const fee = (c: 'Corporate' | 'Associate' | 'Women') =>
    `admission Rs ${f[c].admission}, subscription Rs ${f[c].subscription}, card Rs ${f[c].card}`;
  const docs: Record<string, string[]> = {};
  for (const r of reqs ?? []) (docs[r.biz_type] ??= []).push(r.label_en);
  const faq = [1, 2, 3, 4, 5]
    .map((i) => {
      try {
        return `Q: ${msg(locale, `site.membership.q${i}`)}\nA: ${msg(locale, `site.membership.a${i}`, {
          corporate: String(f.Corporate.admission + f.Corporate.subscription + f.Corporate.card),
          associate: String(f.Associate.admission + f.Associate.subscription + f.Associate.card),
          women: String(f.Women.admission + f.Women.subscription + f.Women.card),
          extra: String(f.extraCard),
        })}`;
      } catch {
        return '';
      }
    })
    .filter(Boolean);
  return [
    `MCCI: ${s.chamber.name}. Address: ${s.chamber.addr}. Telephone: ${s.chamber.tel}. Email: ${s.chamber.email}.`,
    `Membership fees — Corporate: ${fee('Corporate')}. Associate: ${fee('Associate')}. Women entrepreneurs: ${fee('Women')}. Extra member card: Rs ${f.extraCard}.`,
    `A membership application needs a proposer and a seconder who are current MCCI members; each has ${s.endorse.days} days to sign. MCCI aims to process a complete file in ${s.processDays} working days.`,
    `Steps: create an account, fill in the membership form with documents, request proposer and seconder, submit, MCCI review, Membership Committee decision, pay the voucher, receive the membership number and certificate.`,
    `Services: ${(services ?? []).map((v) => `${v.name_en} (fee Rs ${v.fee}, about ${Math.round(v.sla_hours / 24) || 1} day(s))`).join('; ')}.`,
    ...Object.entries(docs).map(([biz, list]) => `Documents for business type ${biz}: ${list.join('; ')}.`),
    `Certificates can be checked by anyone at /verify by QR code, reference or membership number.`,
    ...faq,
  ].join('\n');
}

/** the member's own files, by reference and stage only */
export async function ownStatus(session: Session): Promise<string> {
  const companies = session.access.companies.map((c) => c.id);
  if (!companies.length) return 'The member has no company and no application yet.';
  const supabase = await createClient();
  const [{ data: apps }, { data: svcs }] = await Promise.all([
    supabase
      .from('applications')
      .select('token, stage, submitted_at, member_no')
      .in('company_id', companies)
      .order('created_at', { ascending: false })
      .limit(5),
    supabase
      .from('service_requests')
      .select('token, service_key, status, submitted_at')
      .in('company_id', companies)
      .order('created_at', { ascending: false })
      .limit(10),
  ]);
  const lines = [
    ...(apps ?? []).map(
      (a) =>
        `Membership application FILE:${a.token} — stage ${a.stage}${a.member_no ? `, membership number ${a.member_no}` : ''}.`,
    ),
    ...(svcs ?? []).map((r) => `Service request ${r.token} (${r.service_key}) — status ${r.status}.`),
  ];
  return lines.length ? lines.join('\n') : 'The member has no applications or service requests yet.';
}
