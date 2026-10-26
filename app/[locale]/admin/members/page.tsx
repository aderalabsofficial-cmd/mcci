import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { NoAccess } from '@/components/admin/no-access';
import { AddMember } from '@/components/members/add-member';
import { DemoCard, type DemoRow, type MarkableRow } from '@/components/members/demo-card';
import { Kpi } from '@/components/review/kpi';
import { PageHeader } from '@/components/shared/page-header';
import { asLocale } from '@/i18n/locale';
import { msg } from '@/lib/nav/model';
import { staffLevel } from '@/lib/permissions/levels';
import { requireUser } from '@/lib/permissions/server';
import { createClient } from '@/lib/supabase/server';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return { title: msg(asLocale((await params).locale), 'register.title') };
}

export const dynamic = 'force-dynamic';

/** the membership year ends on 31 March (docs/02) */
function yearEnd(): string {
  const now = new Date();
  const y = now.getUTCMonth() >= 3 ? now.getUTCFullYear() + 1 : now.getUTCFullYear();
  return `${y}-03-31`;
}

/** Members Register (prototype admin/members, minimal for Release 3): members with their owners' sign-in status. */
export default async function MembersPage({ params }: Props) {
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
  const date = (iso: string) => new Date(iso).toLocaleDateString(locale === 'ur' ? 'ur-PK' : 'en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  const supabase = await createClient();
  const { data: members } = await supabase
    .from('members')
    .select('id, member_no, class, women, status, rep_name, valid_to, company_id, companies!inner(name, demo)')
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
  const invited = new Map((invites ?? []).map((i) => [i.company_id, i.status]));
  const rows = members ?? [];

  return (
    <div className="proto">
      <div className="ph">
        <div>
          <h1>{m('title')}</h1>
          <p>{m('sub')}</p>
        </div>
        <div className="pb">{level >= 2 && <AddMember locale={locale} validTo={yearEnd()} />}</div>
      </div>
      <div className="kg">
        <Kpi label={m('kMembers')} value={rows.length} sub={m('kMembersSub')} icon="users" color="#7c3aed" />
        <Kpi label={m('kPermanent')} value={rows.filter((r) => r.status === 'Permanent').length} icon="check" color="#1fa34a" />
        <Kpi label={m('kTemporary')} value={rows.filter((r) => r.status === 'Temporary').length} icon="hourglass" color="#14b8a6" />
      </div>
      <div className="card">
        <div className="ch">
          <h3>{m('table')}</h3>
        </div>
        <div className="tw" tabIndex={0} role="region" aria-label={m('table')}>
          <table>
            <thead>
              <tr>
                {(['no', 'company', 'rep', 'cls', 'validTo', 'owner', 'status'] as const).map((c) => (
                  <th key={c} scope="col">
                    {m(`cols.${c}`)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr className="st" key={r.id}>
                  <td>
                    <b>{r.member_no}</b>
                  </td>
                  <td>{(r.companies as unknown as { name: string } | null)?.name ?? '—'}</td>
                  <td>{r.rep_name}</td>
                  <td>
                    {msg(locale, `membership.classes.${r.class}`)}
                    {r.women ? ' · W' : ''}
                  </td>
                  <td>{date(r.valid_to)}</td>
                  <td>{m(`owner_${invited.get(r.company_id) ?? 'none'}`)}</td>
                  <td>
                    <span className={`bd ${r.status === 'Permanent' ? 'green' : r.status === 'Temporary' ? 'blue' : 'red'}`}>{m(`status.${r.status}`)}</span>
                  </td>
                </tr>
              ))}
              {!rows.length && (
                <tr className="st">
                  <td colSpan={7} className="em">
                    {m('none')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      <DemoCard locale={locale} rows={demoRows} canManage={level >= 3} markable={markable} />
    </div>
  );
}
