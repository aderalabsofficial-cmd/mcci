import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { HomeNext } from '@/components/membership/home-next';
import { ProtoTabs } from '@/components/membership/tabs';
import { both, Card, Journey, KV, L } from '@/components/membership/ui';
import { Link } from '@/i18n/navigation';
import { asLocale } from '@/i18n/locale';
import { classOf, fee } from '@/lib/flow/application';
import { JOURNEY, journeyIndex } from '@/lib/membership/reference';
import { loadMyApplication, loadMyMembership, loadPublicSettings } from '@/lib/membership/load';
import { voucherDate } from '@/lib/committee/voucher';
import { msg } from '@/lib/nav/model';
import { createClient } from '@/lib/supabase/server';

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
  const supabase = await createClient();
  const [app, member, settings, { data: docs }] = await Promise.all([
    loadMyApplication(),
    loadMyMembership(),
    loadPublicSettings(),
    supabase.from('documents').select('code, kind, status, valid_to').order('created_at', { ascending: false }),
  ]);
  const m = (k: string, v?: Record<string, string>) => msg(locale, `membership.${k}`, v);
  const asMember = member && (!app || ['withdrawn', 'draft', 'rejected', 'permanent'].includes(app.stage));
  const open = !asMember && app && app.stage !== 'withdrawn';
  const due =
    open && app.form.biz
      ? fee(app.form, app.women, app.partners.filter((p) => p.extra_card).length, settings.fees)
      : null;

  const status = (
    <>
      <HomeNext app={app} locale={locale} member={member} />
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
      ) : asMember ? (
        <Card title={m('page.member.title')}>
          <KV
            pairs={[
              [m('page.member.company'), member.company],
              [m('page.member.no'), member.member_no],
              [m('page.member.cls'), `${m(`classes.${member.class}`)}${member.women ? ' · W' : ''}`],
              [m('page.member.status'), msg(locale, `register.status.${member.status}`)],
              [m('page.member.since'), voucherDate(`${member.since}T12:00:00+05:00`, locale)],
              [m('page.member.validTo'), voucherDate(`${member.valid_to}T12:00:00+05:00`, locale)],
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
            {docs?.length ? (
              docs.map((d) => (
                <div className="tg" key={d.code}>
                  <span>
                    <b>{msg(locale, `docs.admin.kinds.${d.kind}`)}</b>
                    <small style={{ display: 'block' }}>
                      {d.code} · {msg(locale, `verify.status.${d.status}`)}
                    </small>
                  </span>
                  <Link className="btn btn-w" href={`/portal/documents?code=${d.code}`} data-action="doc.view">
                    {msg(locale, 'docs.member.view')}
                  </Link>
                </div>
              ))
            ) : (
              <p className="muted">{m('page.certsLater')}</p>
            )}
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
