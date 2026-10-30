import 'server-only';
import type { Session } from '@/lib/permissions/server';
import { staffLevel } from '@/lib/permissions/levels';
import { createClient } from '@/lib/supabase/server';

/**
 * Global search for staff (owner instruction Part 3.4; top-bar search.open): member numbers, company names,
 * application and service tokens, voucher numbers and support tickets. Permission-aware twice over: each kind is
 * searched only when the person's designation can open that screen, and every query runs with their own session
 * (row-level security). Titles and references only — never document contents, notes or personal details.
 * Demo companies are left out.
 */
export interface Hit {
  kind: 'member' | 'application' | 'service' | 'voucher' | 'ticket';
  ref: string;
  title: string;
  href: string;
}

/** the term as a safe ilike pattern for PostgREST filters (no wildcards, commas or brackets from the user) */
export function searchTerm(raw: string): string | null {
  const q = raw
    .normalize('NFKC')
    .replace(/[%_,()*\\]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return q.length >= 2 && q.length <= 60 ? q : null;
}

export async function globalSearch(session: Session, raw: string): Promise<Hit[]> {
  const q = searchTerm(raw);
  if (!q || !session.access.staff) return [];
  const db = await createClient();
  const like = `%${q}%`;
  const can = (m: Parameters<typeof staffLevel>[1]) => staffLevel(session.access, m) >= 1;
  const jobs: PromiseLike<Hit[]>[] = [];

  if (can('reg'))
    jobs.push(
      db
        .from('members')
        .select('id, member_no, companies!inner(name, demo)')
        .eq('companies.demo', false)
        .ilike('member_no', like)
        .limit(8)
        .then(({ data }) =>
          (data ?? []).map((m) => ({
            kind: 'member' as const,
            ref: m.member_no,
            title: (m.companies as { name: string }).name,
            href: `/admin/member?id=${m.id}`,
          })),
        ),
      db
        .from('members')
        .select('id, member_no, companies!inner(name, demo)')
        .eq('companies.demo', false)
        .ilike('companies.name', like)
        .limit(8)
        .then(({ data }) =>
          (data ?? []).map((m) => ({
            kind: 'member' as const,
            ref: m.member_no,
            title: (m.companies as { name: string }).name,
            href: `/admin/member?id=${m.id}`,
          })),
        ),
    );
  if (can('mem'))
    jobs.push(
      db
        .from('applications')
        .select('token, stage, companies!inner(name, demo)')
        .eq('companies.demo', false)
        .ilike('token', like)
        .limit(8)
        .then(({ data }) =>
          (data ?? []).map((a) => ({
            kind: 'application' as const,
            ref: a.token,
            title: `${(a.companies as { name: string }).name} · ${a.stage}`,
            href: `/admin/mreview?t=${a.token}`,
          })),
        ),
    );
  if (can('svc'))
    jobs.push(
      db
        .from('service_requests')
        .select('token, service_key, status')
        .ilike('token', like)
        .limit(8)
        .then(({ data }) =>
          (data ?? []).map((r) => ({
            kind: 'service' as const,
            ref: r.token,
            title: `${r.service_key} · ${r.status}`,
            href: `/admin/review?t=${r.token}`,
          })),
        ),
    );
  if (can('pay'))
    jobs.push(
      db
        .from('payment_vouchers')
        .select('voucher_no, status, amount')
        .ilike('voucher_no', like)
        .limit(8)
        .then(({ data }) =>
          (data ?? []).map((v) => ({
            kind: 'voucher' as const,
            ref: v.voucher_no,
            title: `Rs ${v.amount} · ${v.status}`,
            href: '/admin/payments',
          })),
        ),
    );
  if (can('eng'))
    jobs.push(
      db
        .from('tickets')
        .select('id, public_ref, subject, status')
        .or(`public_ref.ilike.${like},subject.ilike.${like}`)
        .limit(8)
        .then(({ data }) =>
          (data ?? []).map((t) => ({
            kind: 'ticket' as const,
            ref: t.public_ref ?? '',
            title: `${t.subject} · ${t.status}`,
            href: `/admin/complaints?t=${t.id}`,
          })),
        ),
    );
  const seen = new Set<string>();
  return (await Promise.all(jobs))
    .flat()
    .filter((h) => (seen.has(h.kind + h.ref) ? false : (seen.add(h.kind + h.ref), true)));
}
