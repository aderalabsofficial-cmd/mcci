import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { ChevronRight } from 'lucide-react';
import { Ic } from '@/components/membership/ui';
import { Kpi } from '@/components/review/kpi';
import { Link } from '@/i18n/navigation';
import { asLocale } from '@/i18n/locale';
import { pkr, voucherDate } from '@/lib/committee/voucher';
import { msg } from '@/lib/nav/model';
import { staffLevel } from '@/lib/permissions/levels';
import { requireUser } from '@/lib/permissions/server';
import { createClient } from '@/lib/supabase/server';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return { title: msg(asLocale((await params).locale), 'screens.admin.dashboard') };
}

export const dynamic = 'force-dynamic';

interface Attention {
  key: string;
  icon: string;
  color: string;
  count: number;
  href: string;
}

/**
 * Staff dashboard (prototype admin/dashboard): today at a glance — what needs this person's attention in the modules
 * their designation can see (docs/06), headline figures and the latest steps on membership files. Every number is read
 * with the staff member's own session, so RLS decides what is counted.
 */
export default async function AdminHomePage({ params }: Props) {
  const locale = asLocale((await params).locale);
  setRequestLocale(locale);
  const session = await requireUser();
  const lv = (m: Parameters<typeof staffLevel>[1]) => staffLevel(session.access, m);
  const m = (k: string, v?: Record<string, string>) => msg(locale, `dashboard.${k}`, v);
  const supabase = await createClient();
  const count = async (q: PromiseLike<{ count: number | null }>) => (await q).count ?? 0;
  const head = { count: 'exact' as const, head: true };
  const soon = new Date(Date.now() + 15 * 86_400_000).toISOString();
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();

  const [review, committee, receipts, expiring, paidThisMonth, members, temps, history] = await Promise.all([
    lv('mem') >= 1
      ? count(supabase.from('applications').select('id, companies!inner(demo)', head).in('stage', ['submitted', 'review']).eq('companies.demo', false))
      : 0,
    lv('cmt') >= 1
      ? count(supabase.from('applications').select('id, companies!inner(demo)', head).eq('stage', 'committee').eq('companies.demo', false))
      : 0,
    lv('pay') >= 1 ? count(supabase.from('payment_vouchers').select('id', head).eq('status', 'Receipt uploaded')) : 0,
    lv('temp') >= 1
      ? count(supabase.from('temp_memberships').select('id', head).eq('status', 'active').lte('expires_at', soon))
      : 0,
    lv('pay') >= 1
      ? supabase.from('payment_vouchers').select('amount').eq('status', 'Paid').gte('paid_at', monthStart)
      : Promise.resolve({ data: [] as { amount: number }[] }),
    // official members only: demo members (0350) are never counted
    lv('reg') >= 1
      ? count(supabase.from('members').select('id, companies!inner(demo)', head).in('status', ['Permanent', 'Temporary']).eq('companies.demo', false))
      : 0,
    lv('temp') >= 1 ? count(supabase.from('temp_memberships').select('id', head).eq('status', 'active')) : 0,
    lv('mem') >= 1
      ? supabase
          .from('application_history')
          .select('id, at, step, by_name, applications(token, form)')
          .order('at', { ascending: false })
          .limit(8)
      : Promise.resolve({ data: [] }),
  ]);
  const collected = ((paidThisMonth as { data: { amount: number }[] | null }).data ?? []).reduce((s, v) => s + v.amount, 0);
  const attention: Attention[] = [
    { key: 'review', icon: 'shield', color: '#f59e0b', count: review, href: '/admin/requests' },
    { key: 'committee', icon: 'award', color: '#c8963e', count: committee, href: '/admin/committee' },
    { key: 'receipts', icon: 'upload', color: '#ef4444', count: receipts, href: '/admin/payments' },
    { key: 'expiring', icon: 'hourglass', color: '#14b8a6', count: expiring, href: '/admin/temp' },
  ].filter((a) => a.count > 0);
  const stepLabel = (step: string) => {
    try {
      return msg(locale, `membership.track.steps.${step}`);
    } catch {
      return step;
    }
  };
  const first = (session.access.full_name ?? '').trim().split(/\s+/)[0] ?? '';

  return (
    <div className="proto">
      <div className="ph">
        <div>
          <h1>{m('hello', { name: first })}</h1>
          <p>
            {voucherDate(new Date().toISOString(), locale)} · {session.access.staff?.designation ?? ''}
          </p>
        </div>
      </div>
      <div className="kg">
        <Kpi label={m('kMembers')} value={members} sub={m('kMembersSub')} icon="users" color="#7c3aed" />
        <Kpi label={m('kTemp')} value={temps} sub={m('kTempSub')} icon="hourglass" color="#14b8a6" />
        <Kpi label={m('kCollected')} value={pkr(collected)} sub={m('kCollectedSub')} icon="card" color="#1fa34a" />
        <Kpi label={m('kCommittee')} value={committee} sub={m('kCommitteeSub')} icon="award" color="#c8963e" />
      </div>
      <div className="g2c" style={{ alignItems: 'start' }}>
        <section className="card" aria-labelledby="att">
          <div className="ch">
            <h3 id="att">{m('attention')}</h3>
          </div>
          {attention.length ? (
            attention.map((a) => (
              <Link key={a.key} className="li" href={a.href} data-action="nav" data-attention={a.key}>
                <i style={{ background: a.color }}>
                  <Ic name={a.icon} color="#fff" />
                </i>
                <div>
                  <b>{m(`att.${a.key}`, { n: String(a.count) })}</b>
                  <small>{m(`att.${a.key}Sub`)}</small>
                </div>
                <ChevronRight size={18} aria-hidden />
              </Link>
            ))
          ) : (
            <p className="em">{m('allClear')}</p>
          )}
        </section>
        <section className="card" aria-labelledby="act">
          <div className="ch">
            <h3 id="act">{m('activity')}</h3>
          </div>
          {((history as { data: unknown[] | null }).data ?? []).length ? (
            (
              (history as {
                data: { id: number; at: string; step: string; by_name: string | null; applications: unknown }[];
              }).data ?? []
            ).map((h) => {
              const app = h.applications as { token: string; form: { name?: string } | null } | null;
              return (
                <div className="tg" key={h.id}>
                  <span>
                    <b>{stepLabel(h.step)}</b>
                    <small style={{ display: 'block' }}>
                      {app?.form?.name || app?.token} · {h.by_name ?? m('system')}
                    </small>
                  </span>
                  <small className="muted">{voucherDate(h.at, locale)}</small>
                </div>
              );
            })
          ) : (
            <p className="em">{m('noActivity')}</p>
          )}
        </section>
      </div>
    </div>
  );
}
