import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { HomeNext } from '@/components/membership/home-next';
import { ProtoTabs } from '@/components/membership/tabs';
import { both, Card, Journey, KV, L } from '@/components/membership/ui';
import { Link } from '@/i18n/navigation';
import { asLocale } from '@/i18n/locale';
import { classOf, fee } from '@/lib/flow/application';
import { JOURNEY, journeyIndex } from '@/lib/membership/reference';
import { loadMyApplication, loadPublicSettings } from '@/lib/membership/load';
import { msg } from '@/lib/nav/model';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return { title: msg(asLocale((await params).locale), 'screens.portal.membership') };
}

/**
 * My Membership (prototype member/membership): status with the 8 steps; certificates & cards and renewal fill in
 * once MCCI approves, the fee is paid and the certificate is printed (M5–M7).
 */
export default async function MembershipPage({ params }: Props) {
  const locale = asLocale((await params).locale);
  setRequestLocale(locale);
  const [app, settings] = await Promise.all([loadMyApplication(), loadPublicSettings()]);
  const m = (k: string, v?: Record<string, string>) => msg(locale, `membership.${k}`, v);
  const open = app && app.stage !== 'withdrawn';
  const due =
    open && app.form.biz
      ? fee(app.form, app.women, app.partners.filter((p) => p.extra_card).length, settings.fees)
      : null;

  const status = (
    <>
      <HomeNext app={app} locale={locale} />
      {open && app.stage !== 'draft' && (
        <Card title={<L {...both('membership.home.journey')} />}>
          <Journey stage={app.stage} big />
        </Card>
      )}
      {open ? (
        <Card title={m('page.applicationKV')}>
          <KV
            pairs={[
              [m('fields.name'), app.form.name],
              [m('page.applicationKV'), app.token],
              [
                m('page.stage'),
                app.stage === 'draft'
                  ? m('wiz.pageTitle')
                  : msg(locale, `membership.journey.${JOURNEY[Math.max(0, journeyIndex(app.stage))]!.k}.name`),
              ],
              [m('wiz.submitted.cls'), app.form.biz ? m(`classes.${app.class ?? classOf(app.form)}`) : ''],
              [m('page.feeDue'), due ? `Rs. ${due.total.toLocaleString('en-PK')}` : ''],
            ]}
          />
        </Card>
      ) : (
        <p className="muted">{m('page.noApp')}</p>
      )}
    </>
  );

  return (
    <>
      <div className="ph">
        <div>
          <h1>
            <L {...both('membership.page.title')} />
          </h1>
          {open && (
            <p>
              {app.form.name || m('home.newApplicant')} · {app.token}
            </p>
          )}
        </div>
        {open && (
          <div className="pb">
            <Link className="btn" href="/portal/form" data-action="doc.view">
              {m('page.officialForm')}
            </Link>
          </div>
        )}
      </div>
      <ProtoTabs
        labels={[
          <L key="s" {...both('membership.page.tabs.status')} />,
          <L key="c" {...both('membership.page.tabs.certs')} />,
          <L key="r" {...both('membership.page.tabs.renew')} />,
        ]}
        panels={[
          status,
          <Card key="c" title={<L {...both('membership.page.tabs.certs')} />}>
            <p className="muted">{m('page.certsLater')}</p>
            <p className="muted">{m('page.cardsLater')}</p>
          </Card>,
          <Card key="r" title={<L {...both('membership.page.tabs.renew')} />}>
            <p className="muted">{m('page.renewLater')}</p>
          </Card>,
        ]}
      />
    </>
  );
}
