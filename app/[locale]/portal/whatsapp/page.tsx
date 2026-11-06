import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { PageHeader } from '@/components/shared/page-header';
import { WhatNowCard } from '@/components/portal/what-now-card';
import { MemberWhatsapp } from '@/components/whatsapp/member-prefs';
import { Link } from '@/i18n/navigation';
import { asLocale } from '@/i18n/locale';
import { msg } from '@/lib/nav/model';
import { requireUser } from '@/lib/permissions/server';
import { isConsented } from '@/lib/whatsapp/consent';
import { loadMyWhatsapp } from '@/lib/whatsapp/consent-load';

type Props = { params: Promise<{ locale: string }>; searchParams: Promise<{ company?: string; welcome?: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return { title: msg(asLocale((await params).locale), 'screens.portal.whatsapp') };
}

export const dynamic = 'force-dynamic';

/**
 * WhatsApp Preferences (not in the prototype; owner's brief of 6 Nov 2026, docs/30 §12): every company user can see
 * the status; the Owner or a Manager adds or changes the number, chooses categories, gives or withdraws consent and
 * confirms the number on WhatsApp. Available whether or not MCCI has opened consent (decision A): until then the
 * page says consent is awaiting approval and only the contact can be changed.
 */
export default async function WhatsappPreferencesPage({ params, searchParams }: Props) {
  const locale = asLocale((await params).locale);
  setRequestLocale(locale);
  const both = (path: string) => ({ en: msg('en', path), ur: msg('ur', path) });
  const session = await requireUser();
  const sp = await searchParams;
  const company = session.access.companies.find((c) => c.id === sp.company) ?? session.access.companies[0];
  const data = company ? await loadMyWhatsapp(company.id) : null;

  if (!company || !data) {
    return (
      <>
        <PageHeader locale={locale} title={both('screens.portal.whatsapp')} bilingual />
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

  const next = isConsented(data.status)
    ? 'active'
    : data.status === 'not_collected' && !data.open
      ? 'not_collected_closed'
      : data.status;
  const tone = data.status === 'blocked' ? 'red' : isConsented(data.status) ? 'green' : 'blue';
  return (
    <>
      <PageHeader locale={locale} title={both('screens.portal.whatsapp')} bilingual />
      {sp.welcome === '1' && (
        <div className="card wa-welcome" data-section="wa-welcome">
          <div className="ch">
            <h3>{msg(locale, 'wa.prefs.welcome.title')}</h3>
          </div>
          <p>{msg(locale, 'wa.prefs.welcome.body')}</p>
          <div className="pb">
            <Link href="/portal" className="btn btn-w" data-action="wa.prefs.skip">
              {msg(locale, 'wa.prefs.welcome.skip')}
            </Link>
          </div>
        </div>
      )}
      <WhatNowCard
        locale={locale}
        tone={tone}
        icon="chat"
        heading={both('portal.whatNow')}
        title={both(`wa.prefs.next.${next}.title`)}
        body={msg(locale, `wa.prefs.next.${next}.body`)}
      />
      <p className="muted" style={{ marginBottom: 12 }}>
        {msg(locale, 'wa.prefs.intro')}
      </p>
      <MemberWhatsapp locale={locale} company={company.id} data={data} />
    </>
  );
}
