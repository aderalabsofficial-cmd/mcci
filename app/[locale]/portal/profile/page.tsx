import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { CompanyProfile, type Person } from '@/components/portal/company-profile';
import { WhatNowCard } from '@/components/portal/what-now-card';
import { PageHeader } from '@/components/shared/page-header';
import { asLocale } from '@/i18n/locale';
import { PARTICULAR_FIELDS } from '@/lib/company/fields';
import { msg } from '@/lib/nav/model';
import { requireUser } from '@/lib/permissions/server';
import { createClient } from '@/lib/supabase/server';

type Props = { params: Promise<{ locale: string }>; searchParams: Promise<{ company?: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return { title: msg(asLocale((await params).locale), 'screens.portal.profile') };
}

export const dynamic = 'force-dynamic';

/**
 * Company Profile (prototype member/profile): registered particulars with "request change" (MCCI approves, M8),
 * the people who can use the company's account (Owner invites and manages them), and preferences. Everything is
 * read with the member's own session, so RLS limits it to their own company; colleagues come from
 * api.company_people() (0290) because profiles are own-row only.
 */
export default async function ProfilePage({ params, searchParams }: Props) {
  const locale = asLocale((await params).locale);
  setRequestLocale(locale);
  const both = (path: string) => ({ en: msg('en', path), ur: msg('ur', path) });
  const session = await requireUser();
  const wanted = (await searchParams).company;
  const company = session.access.companies.find((c) => c.id === wanted) ?? session.access.companies[0];

  if (!company) {
    return (
      <>
        <PageHeader locale={locale} title={both('screens.portal.profile')} bilingual />
        <WhatNowCard
          locale={locale}
          tone="blue"
          icon="building"
          heading={both('portal.whatNow')}
          title={both('access.company.noCompany')}
          body={msg(locale, 'access.company.noCompanyBody')}
        />
      </>
    );
  }

  const canManage = company.levels.profile >= 3;
  const supabase = await createClient();
  const [details, people, invites, changes, me] = await Promise.all([
    supabase.from('companies').select(PARTICULAR_FIELDS.join(', ')).eq('id', company.id).single(),
    supabase.schema('api').rpc('company_people', { p_company: company.id }),
    canManage
      ? supabase
          .from('invitations')
          .select('id, email, full_name, company_role, status, expires_at, created_at')
          .eq('kind', 'company_user')
          .eq('company_id', company.id)
          .in('status', ['Invited', 'Expired'])
          .order('created_at', { ascending: false })
      : Promise.resolve({ data: [], error: null }),
    supabase
      .from('change_requests')
      .select('id, field, new_value, status, created_at')
      .eq('company_id', company.id)
      .order('created_at', { ascending: false })
      .limit(20),
    supabase.from('profiles').select('lang').eq('id', session.userId).single(),
  ]);
  for (const r of [details, people, invites, changes, me]) if (r.error) throw new Error(r.error.message);

  // partners / directors as given on the company's latest membership application (M3 writes them)
  const latest = await supabase
    .from('applications')
    .select('id')
    .eq('company_id', company.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (latest.error) throw new Error(latest.error.message);
  const partners = latest.data
    ? await supabase
        .from('application_partners')
        .select('id, name, mobile, extra_card')
        .eq('application_id', latest.data.id)
        .order('position')
    : { data: [], error: null };
  if (partners.error) throw new Error(partners.error.message);

  const now = Date.now();
  const persons: Person[] = [
    ...(people.data ?? []).map((p): Person => ({
      kind: 'user',
      id: p.user_id,
      name: p.full_name,
      email: p.email,
      role: p.role,
      status: 'Active',
      sentAt: null,
      self: p.user_id === session.userId,
    })),
    ...(invites.data ?? []).map((i): Person => ({
      kind: 'invitation',
      id: i.id,
      name: i.full_name ?? i.email,
      email: i.email,
      role: i.company_role ?? 'Viewer',
      status: i.status === 'Invited' && Date.parse(i.expires_at) <= now ? 'Expired' : (i.status as Person['status']),
      sentAt: i.created_at,
      self: false,
    })),
  ];

  return (
    <>
      <PageHeader locale={locale} title={both('screens.portal.profile')} bilingual />
      <WhatNowCard
        locale={locale}
        tone="blue"
        icon="building"
        heading={both('portal.whatNow')}
        title={both('access.company.whatNowTitle')}
        body={msg(locale, 'access.company.whatNowBody')}
      />
      <CompanyProfile
        locale={locale}
        companyId={company.id}
        canManage={canManage}
        details={details.data as unknown as Record<string, string | null>}
        changes={(changes.data ?? []).map((c) => ({
          id: c.id,
          field: c.field,
          value: c.new_value,
          status: c.status,
          at: c.created_at,
        }))}
        people={persons}
        partners={(partners.data ?? []).map((p) => ({ id: p.id, name: p.name, mobile: p.mobile, card: p.extra_card }))}
        urduFirst={me.data?.lang === 'ur'}
      />
    </>
  );
}
