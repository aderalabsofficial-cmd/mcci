import { CheckCircle2, ChevronRight, Search } from 'lucide-react';
import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { ActionButton } from '@/components/admin/action-button';
import { FlashProvider } from '@/components/admin/flash';
import { NoAccess } from '@/components/admin/no-access';
import { AddMember } from '@/components/members/add-member';
import { type ClaimRow, ClaimsCard } from '@/components/members/claims-card';
import { DemoCard, type DemoRow, type MarkableRow } from '@/components/members/demo-card';
import { RenewalSeason, RenewDialog, RestoreDialog } from '@/components/members/lifecycle';
import { Kpi } from '@/components/review/kpi';
import { PageHeader } from '@/components/shared/page-header';
import { Link } from '@/i18n/navigation';
import { asLocale } from '@/i18n/locale';
import { msg } from '@/lib/nav/model';
import { staffLevel } from '@/lib/permissions/levels';
import { requireUser } from '@/lib/permissions/server';
import { createClient } from '@/lib/supabase/server';
import { matchesRegisterFilter, REGISTER_FILTERS, STATUS_TONE, type RegisterFilter } from '@/lib/whatsapp/consent';
import { loadRegisterWhatsapp } from '@/lib/whatsapp/consent-load';

type Props = { params: Promise<{ locale: string }>; searchParams: Promise<{ q?: string; show?: string; wa?: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return { title: msg(asLocale((await params).locale), 'register.title') };
}

export const dynamic = 'force-dynamic';

/** the membership year ends on 31 March (docs/02) */
const yearEndOf = (day: string): string => {
  const y = Number(day.slice(0, 4));
  return `${Number(day.slice(5, 7)) >= 4 ? y + 1 : y}-03-31`;
};
const addDay = (day: string) => {
  const t = new Date(`${day}T00:00:00Z`);
  t.setUTCDate(t.getUTCDate() + 1);
  return t.toISOString().slice(0, 10);
};

const SHOW = ['all', 'corporate', 'associate', 'active', 'lapsed', 'noDate', 'blacklisted'] as const;
type Show = (typeof SHOW)[number];

/** Members Register: one clear list. Clicking a member opens their whole record; search and tabs narrow the list. */
export default async function MembersPage({ params, searchParams }: Props) {
  const locale = asLocale((await params).locale);
  setRequestLocale(locale);
  const session = await requireUser();
  const level = staffLevel(session.access, 'reg');
  const m = (k: string, v?: Record<string, string>) => msg(locale, `register.${k}`, v);
  if (level < 1) {
    return (
      <>
        <PageHeader locale={locale} title={{ en: msg('en', 'register.title'), ur: msg('ur', 'register.title') }} bilingual={false} />
        <NoAccess locale={locale} designation={session.access.staff?.designation ?? ''} module="reg" />
      </>
    );
  }
  const sp = await searchParams;
  const show: Show = (SHOW as readonly string[]).includes(sp.show ?? '') ? (sp.show as Show) : 'all';
  const q = (sp.q ?? '').trim().slice(0, 100);
  // WhatsApp column and filters (0690): status only, never numbers; for staff whose limits include WhatsApp
  const waRows = staffLevel(session.access, 'out') >= 1 || staffLevel(session.access, 'biz') >= 1 ? await loadRegisterWhatsapp() : null;
  const waFilter = waRows && (REGISTER_FILTERS as readonly string[]).includes(sp.wa ?? '') ? (sp.wa as RegisterFilter) : null;
  const date = (iso: string | null) =>
    iso ? new Date(iso).toLocaleDateString(locale === 'ur' ? 'ur-PK' : 'en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
  const supabase = await createClient();
  const { data: members } = await supabase
    .from('members')
    .select('id, member_no, class, women, status, rep_name, since, valid_to, company_id, blacklisted, blacklist_note, companies!inner(name, demo)')
    .eq('companies.demo', false)
    .order('member_no');
  const { data: invites } = await supabase.from('invitations').select('company_id, status, email').eq('kind', 'company_user');
  // demo mode (0350): shown apart, never counted with the official members
  const { data: demoCos } = await supabase
    .from('companies')
    .select('id, name, demo_expires_at, members(member_no, class)')
    .eq('demo', true)
    .order('created_at');
  const demoRows: DemoRow[] = (demoCos ?? []).map((c) => {
    const mem = (c.members as unknown as { member_no: string; class: string }[] | null)?.[0];
    const inv = (invites ?? []).find((i) => i.company_id === c.id);
    return {
      company: c.name,
      memberNo: mem?.member_no ?? null,
      cls: mem?.class ?? null,
      owner: inv ? `${inv.email} · ${m(`owner_${inv.status}`)}` : '—',
      expires: c.demo_expires_at ? date(c.demo_expires_at) : '—',
    };
  });
  // self-registered applicants the Secretary General may turn into demo applicants (0405); the function checks reg ≥ 3
  const { data: markRows } = level >= 3 ? await supabase.schema('api').rpc('demo_markable') : { data: null };
  const markable: MarkableRow[] = (markRows ?? []).map((a) => ({
    id: a.company_id,
    label: [a.company, a.token, a.owner_email].filter(Boolean).join(' · '),
  }));
  const { data: opensOn } = level >= 3 ? await supabase.schema('api').rpc('renewal_opens_on') : { data: null };
  // existing members who signed up and asked to be linked (0680), oldest first
  const { data: claimRows } = await supabase
    .from('membership_claims')
    .select('id, class, member_no, company_name, match_member, created_at, profiles!membership_claims_user_id_fkey(full_name, email, mobile)')
    .eq('status', 'pending')
    .order('created_at');
  const claims: ClaimRow[] = (claimRows ?? []).map((c) => {
    const p = c.profiles as unknown as { full_name: string | null; email: string | null; mobile: string | null } | null;
    return {
      id: c.id,
      person: p?.full_name ?? '—',
      email: p?.email ?? '',
      mobile: p?.mobile ?? '',
      cls: c.class,
      claimed: c.member_no ?? '',
      company: c.company_name ?? '',
      match: c.match_member,
    };
  });
  const invited = new Map((invites ?? []).map((i) => [i.company_id, i.status]));
  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Karachi' });
  const rows = members ?? [];
  const name = (r: (typeof rows)[number]) => (r.companies as unknown as { name: string } | null)?.name ?? '—';
  const lapsed = (r: (typeof rows)[number]) => r.status !== 'Permanent' || r.valid_to < today;
  const counts: Record<Show, number> = {
    all: rows.length,
    corporate: rows.filter((r) => r.class === 'Corporate').length,
    associate: rows.filter((r) => r.class === 'Associate').length,
    active: rows.filter((r) => !lapsed(r)).length,
    lapsed: rows.filter(lapsed).length,
    noDate: rows.filter((r) => !r.since).length,
    blacklisted: rows.filter((r) => r.blacklisted).length,
  };
  const needle = q.toLowerCase();
  const waOf = (r: (typeof rows)[number]) => waRows?.[r.company_id] ?? { status: 'no_number' as const, verified: false, categories: [] };
  const waCounts = Object.fromEntries(
    REGISTER_FILTERS.map((f) => [f, rows.filter((r) => matchesRegisterFilter(f, waOf(r), !lapsed(r))).length]),
  ) as Record<RegisterFilter, number>;
  const visible = rows.filter((r) => {
    if (show === 'corporate' && r.class !== 'Corporate') return false;
    if (show === 'associate' && r.class !== 'Associate') return false;
    if (show === 'active' && lapsed(r)) return false;
    if (show === 'lapsed' && !lapsed(r)) return false;
    if (show === 'noDate' && r.since) return false;
    if (show === 'blacklisted' && !r.blacklisted) return false;
    if (waFilter && !matchesRegisterFilter(waFilter, waOf(r), !lapsed(r))) return false;
    return !needle || [r.member_no, name(r), r.rep_name].some((v) => v.toLowerCase().includes(needle));
  });
  const base = locale === 'ur' ? '/ur' : '';
  const tabHref = (s: Show) => `/admin/members?${new URLSearchParams({ show: s, ...(q ? { q } : {}), ...(waFilter ? { wa: waFilter } : {}) })}`;
  const waHref = (f: RegisterFilter | null) =>
    `/admin/members?${new URLSearchParams({ show, ...(q ? { q } : {}), ...(f ? { wa: f } : {}) })}`;

  return (
    <div className="proto">
      <FlashProvider>
        <div className="ph">
          <div>
            <h1>{m('title')}</h1>
            <p>{m('sub')}</p>
          </div>
          <div className="pb">
            {session.access.staff?.designation === 'IT Convener' && (
              <a className="btn" href="/api/register/export" download data-action="reg.export">
                {m('export')}
              </a>
            )}
            {level >= 2 && <AddMember locale={locale} validTo={yearEndOf(today)} />}
          </div>
        </div>
        <div className="kg">
          <Kpi label={m('kMembers')} value={rows.length} sub={m('kMembersSub')} icon="users" color="#7c3aed" />
          <Kpi label={m('kCorporate')} value={rows.filter((r) => r.status === 'Permanent' && r.class === 'Corporate').length} icon="check" color="#1fa34a" />
          <Kpi label={m('kAssociate')} value={rows.filter((r) => r.status === 'Permanent' && r.class === 'Associate').length} icon="check" color="#14b8a6" />
          <Kpi label={m('kBlacklisted')} value={counts.blacklisted} sub={m('kBlacklistedSub')} icon="flag" color="#ef4444" />
        </div>
        {level >= 3 && opensOn && (
          <section className="card" data-section="renewal-season">
            <div className="ch">
              <h3>{m('life.season.title')}</h3>
            </div>
            <p className="muted">{m('life.season.help')}</p>
            <RenewalSeason locale={locale} opensOn={opensOn} />
          </section>
        )}
        <ClaimsCard
          locale={locale}
          rows={claims}
          members={(members ?? []).map((r) => ({
            id: r.id,
            label: `${r.member_no} · ${(r.companies as unknown as { name: string } | null)?.name ?? ''}`,
          }))}
          canDecide={level >= 2}
        />
        <div className="card">
          <div className="ch">
            <h3>{m('table')}</h3>
          </div>
          <form method="get" action={`${base}/admin/members`} className="rep-filter" role="search">
            <input type="hidden" name="show" value={show} />
            {waFilter && <input type="hidden" name="wa" value={waFilter} />}
            <label className="form-field reg-search">
              {m('search')}
              <input type="search" name="q" defaultValue={q} placeholder={m('searchHint')} data-field="reg-search" />
            </label>
            <button type="submit" className="btn p" data-action="reg.search">
              <Search size={15} aria-hidden /> {m('searchGo')}
            </button>
          </form>
          <nav className="pills" aria-label={m('showLabel')}>
            {SHOW.map((s) => (
              <Link key={s} href={tabHref(s)} className={`pill ${show === s ? 'on' : ''}`} aria-current={show === s ? 'true' : undefined} data-action="reg.show" data-show={s}>
                {m(`show.${s}`)} ({counts[s]})
              </Link>
            ))}
          </nav>
          {waRows && (
            <nav className="pills" aria-label={msg(locale, 'wa.staff.register.filter')} data-wa-filters>
              <span className="pill-label">{msg(locale, 'wa.staff.register.filter')}:</span>
              <Link href={waHref(null)} className={`pill ${!waFilter ? 'on' : ''}`} aria-current={!waFilter ? 'true' : undefined} data-action="reg.wa" data-wa="all">
                {msg(locale, 'wa.staff.register.all')}
              </Link>
              {REGISTER_FILTERS.map((f) => (
                <Link key={f} href={waHref(f)} className={`pill ${waFilter === f ? 'on' : ''}`} aria-current={waFilter === f ? 'true' : undefined} data-action="reg.wa" data-wa={f}>
                  {msg(locale, `wa.staff.register.filters.${f}`)} ({waCounts[f]})
                </Link>
              ))}
            </nav>
          )}
          <div className="tw" tabIndex={0} role="region" aria-label={m('table')}>
            <table>
              <thead>
                <tr>
                  {(['no', 'company', 'rep', 'since', 'validTo', 'status'] as const).map((c) => (
                    <th key={c} scope="col">
                      {m(`cols.${c}`)}
                    </th>
                  ))}
                  {waRows && <th scope="col">{msg(locale, 'wa.staff.register.col')}</th>}
                  <th scope="col">{m('cols.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((r) => (
                  <tr className="st" key={r.id}>
                    <td>
                      <div>
                        <Link href={`/admin/member?id=${r.id}`} data-action="member.open" className="rowlink">
                          <b>{r.member_no}</b>
                        </Link>
                        <small className="reg-sub" data-member-class>
                          {msg(locale, `membership.classes.${r.class}`)}
                          {r.women ? ' · W' : ''}
                        </small>
                      </div>
                    </td>
                    <td>
                      <Link href={`/admin/member?id=${r.id}`} data-action="member.open" className="rowlink">
                        {name(r)}
                      </Link>
                    </td>
                    <td>{r.rep_name}</td>
                    <td>{r.since ? date(r.since) : <span className="bd orange">{m('noDate')}</span>}</td>
                    <td>{date(r.valid_to)}</td>
                    <td>
                      <div>
                        <span className={`bd ${r.status === 'Permanent' ? 'green' : r.status === 'Temporary' ? 'blue' : 'red'}`}>{m(`status.${r.status}`)}</span>
                        {r.blacklisted && (
                          <span className="bd red" title={r.blacklist_note ?? undefined} data-blacklisted>
                            {m('life.mustWhitelist')}
                          </span>
                        )}
                        <small className="reg-sub">
                          {m('cols.owner')}: {m(`owner_${invited.get(r.company_id) ?? 'none'}`)}
                        </small>
                      </div>
                    </td>
                    {waRows && (
                      <td data-wa-cell={waOf(r).status}>
                        <div>
                          <span className={`bd ${STATUS_TONE[waOf(r).status]}`}>{msg(locale, `wa.wstatus.${waOf(r).status}`)}</span>
                          {waOf(r).verified && (
                            <small className="reg-sub" data-wa-verified>
                              <CheckCircle2 size={12} aria-hidden /> {msg(locale, 'wa.staff.register.verified')}
                            </small>
                          )}
                          {(waOf(r).status === 'full' || waOf(r).status === 'partial') && (
                            <small className="reg-sub">
                              {waOf(r).categories.map((c) => msg(locale, `wa.categories.${c}`)).join(' · ')}
                            </small>
                          )}
                        </div>
                      </td>
                    )}
                    <td>
                      <div className="pb" data-member={r.member_no}>
                        <Link className="btn btn-w" href={`/admin/member?id=${r.id}`} data-action="member.open">
                          {m('open')} <ChevronRight size={14} aria-hidden />
                        </Link>
                        {level >= 2 && (r.status === 'Permanent' || r.status === 'Expired') && (
                          <RenewDialog
                            locale={locale}
                            member={r.id}
                            company={r.company_id}
                            subject={r.member_no}
                            defaultFrom={addDay(r.valid_to)}
                            defaultTo={yearEndOf(addDay(r.valid_to) > today ? addDay(r.valid_to) : today)}
                            canEditPeriod
                          />
                        )}
                        {level >= 2 && lapsed(r) && <RestoreDialog locale={locale} member={r.id} company={r.company_id} subject={r.member_no} />}
                        {level >= 2 && (
                          <ActionButton locale={locale} action={r.blacklisted ? 'reg.whitelist' : 'reg.blacklist'} target={r.id} subject={r.member_no} />
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {!visible.length && (
                  <tr className="st">
                    <td colSpan={waRows ? 8 : 7} className="em">
                      {rows.length ? m('noMatch') : m('none')}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        <DemoCard locale={locale} rows={demoRows} canManage={level >= 3} markable={markable} />
      </FlashProvider>
    </div>
  );
}
