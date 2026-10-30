import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { MemberOpportunities } from '@/components/engagement/opportunities';
import { both, L } from '@/components/membership/ui';
import { asLocale } from '@/i18n/locale';
import { msg } from '@/lib/nav/model';
import { loadOpportunities } from '@/lib/opportunities/load';
import { requireUser } from '@/lib/permissions/server';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return { title: msg(asLocale((await params).locale), 'screens.portal.opportunities') };
}

export const dynamic = 'force-dynamic';

const KEYS = [
  'post',
  'postHelp',
  'title',
  'details',
  'sector',
  'market',
  'days',
  'submit',
  'inquiries',
  'requirements',
  'mine',
  'noneOpen',
  'noneMine',
  'until',
  'interested',
  'interestedBtn',
  'withdrawInterest',
  'message',
  'send',
  'withdraw',
  'noCompany',
  'noRight',
  'statusPending',
  'statusPublished',
  'statusClosed',
  'statusRejected',
  'statusWithdrawn',
  'statusExpired',
];

/** Trade opportunities (prototype member/opportunities): MCCI buyer inquiries, members' requirements, my posts */
export default async function OpportunitiesPage({ params }: Props) {
  const locale = asLocale((await params).locale);
  setRequestLocale(locale);
  const session = await requireUser();
  const company = session.access.companies[0] ?? null;
  const { all, replies } = await loadOpportunities(locale);
  const mineIds = new Set(session.access.companies.map((c) => c.id));
  const others = all.filter((x) => x.open && !(x.raw.company_id && mineIds.has(x.raw.company_id)));
  return (
    <div className="proto">
      <div className="ph">
        <div>
          <h1>
            <L {...both('opp.heading')} />
          </h1>
          <p>{msg(locale, 'opp.sub')}</p>
        </div>
      </div>
      <MemberOpportunities
        locale={locale}
        company={company?.id ?? null}
        canAct={(company?.levels.events ?? 0) >= 2}
        inquiries={others.filter((x) => x.opp.kind === 'inquiry').map((x) => x.opp)}
        requirements={others.filter((x) => x.opp.kind === 'requirement').map((x) => x.opp)}
        mine={all.filter((x) => x.raw.company_id && mineIds.has(x.raw.company_id)).map((x) => x.opp)}
        myInterest={replies
          .filter((r) => r.status === 'Interested' && company && r.company_id === company.id)
          .map((r) => r.opportunity_id)}
        t={Object.fromEntries(KEYS.map((k) => [k, msg(locale, `opp.${k}`)]))}
      />
    </div>
  );
}
