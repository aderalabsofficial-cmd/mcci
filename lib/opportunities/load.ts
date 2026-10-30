import 'server-only';
import type { Opp } from '@/components/engagement/opportunities';
import type { Locale } from '@/i18n/routing';
import { createClient } from '@/lib/supabase/server';

/** Trade opportunities as the caller may see them (RLS: published, own company's, or staff with Events ≥ 1). */
export async function loadOpportunities(locale: Locale) {
  const supabase = await createClient();
  const [{ data: rows }, { data: replies }] = await Promise.all([
    supabase
      .from('opportunities')
      .select('id, kind, title, body, sector, market, status, expires_at, company_id, reject_reason, companies(name)')
      .order('created_at', { ascending: false })
      .limit(300),
    supabase.from('opportunity_replies').select('opportunity_id, company_id, status'),
  ]);
  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Karachi' });
  const day = (d: string) =>
    new Date(`${d}T12:00:00+05:00`).toLocaleDateString(locale === 'ur' ? 'ur-PK' : 'en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  const interests = new Map<string, number>();
  for (const r of replies ?? [])
    if (r.status === 'Interested') interests.set(r.opportunity_id, (interests.get(r.opportunity_id) ?? 0) + 1);
  const all = (rows ?? []).map((o) => ({
    raw: o,
    open: o.status === 'Published' && o.expires_at >= today,
    opp: {
      id: o.id,
      kind: o.kind as Opp['kind'],
      title: o.title,
      body: o.body,
      sector: o.sector,
      market: o.market,
      status: o.status === 'Published' && o.expires_at < today ? 'Expired' : o.status,
      expires: day(o.expires_at),
      company: (o.companies as { name: string } | null)?.name ?? null,
      interests: interests.get(o.id) ?? 0,
      reason: o.reject_reason,
    } satisfies Opp,
  }));
  return { all, replies: replies ?? [] };
}
