import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { EndorseSlots } from '@/components/endorse/slots';
import { Correction } from '@/components/membership/correction';
import { HomeNext } from '@/components/membership/home-next';
import { OfficialForm } from '@/components/membership/official-form';
import { both, Card, KV, L } from '@/components/membership/ui';
import { Wizard } from '@/components/membership/wizard';
import { WithdrawButton } from '@/components/membership/withdraw';
import { Link } from '@/i18n/navigation';
import { asLocale } from '@/i18n/locale';
import { aiEnabled } from '@/lib/ai/extract';
import { classOf } from '@/lib/flow/application';
import { loadDocLists, loadMyApplication, loadPublicSettings } from '@/lib/membership/load';
import { officialFormProps, wizardApp } from '@/lib/membership/view';
import { msg } from '@/lib/nav/model';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return { title: msg(asLocale((await params).locale), 'screens.portal.join') };
}

/** Application form (prototype member/join): wizard while draft, correction screen when returned, summary after. */
export default async function JoinPage({ params }: Props) {
  const locale = asLocale((await params).locale);
  setRequestLocale(locale);
  const [app, settings, docLists] = await Promise.all([loadMyApplication(), loadPublicSettings(), loadDocLists()]);
  const m = (k: string, v?: Record<string, string>) => msg(locale, `membership.${k}`, v);

  if (!app || app.stage === 'withdrawn') {
    return (
      <>
        <div className="ph">
          <div>
            <h1>
              <L {...both('membership.wiz.pageTitle')} />
            </h1>
          </div>
        </div>
        <HomeNext app={app} locale={locale} />
      </>
    );
  }

  const w = await wizardApp(app);
  const preview = <OfficialForm {...officialFormProps(app, w, settings, docLists)} />;
  // proposer & seconder can be chosen until the committee stage (docs/04: in parallel with the document check)
  const endorse = (
    <div id="endorse">
      <EndorseSlots
        locale={locale}
        appId={app.id}
        items={w.endorsements}
        editable={app.canManage && ['draft', 'submitted', 'review', 'returned', 'proposer'].includes(app.stage)}
        cls={m(`classes.${app.class ?? classOf(app.form)}`)}
        business={app.form.name ?? ''}
        applicant={app.form.rep ?? ''}
        days={settings.endorse.days}
        maxPerYear={settings.endorse.maxPerYear}
      />
    </div>
  );

  if (app.stage === 'draft' && app.canEdit) {
    return (
      <>
        <div className="ph">
          <div>
            <h1>
              <L {...both('membership.wiz.pageTitle')} />
            </h1>
            <p>{app.token}</p>
          </div>
        </div>
        <Wizard
          locale={locale}
          app={w}
          fees={settings.fees}
          rules={settings.membership}
          aiOn={aiEnabled()}
          preview={preview}
          endorse={endorse}
        />
      </>
    );
  }

  if (app.stage === 'returned' && app.canEdit) {
    return <Correction locale={locale} app={w} note={app.return_note} />;
  }

  // submitted and later: read-only summary (prototype join, stage ≠ draft)
  const f = app.form;
  const submitted = app.submitted_at
    ? new Date(app.submitted_at).toLocaleDateString(locale === 'ur' ? 'ur-PK' : 'en-GB', {
        timeZone: 'Asia/Karachi',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : '';
  return (
    <>
      <div className="ph">
        <div>
          <h1>
            <L {...both('membership.wiz.submitted.title')} />
          </h1>
          <p>{m('wiz.submitted.on', { token: app.token, date: submitted })}</p>
        </div>
        <div className="pb">
          <Link className="btn btn-primary" href="/portal/form" data-action="doc.view">
            {m('wiz.submitted.viewForm')}
          </Link>
          {app.canManage && ['submitted', 'review', 'proposer'].includes(app.stage) && (
            <WithdrawButton locale={locale} appId={app.id} />
          )}
        </div>
      </div>
      <div className="gr" style={{ gridTemplateColumns: '1fr 1fr' }}>
        <Card title={m('wiz.submitted.business')}>
          <KV
            pairs={[
              [m('fields.name'), f.name],
              [m('wiz.submitted.type'), f.biz ? msg(locale, `membership.biz.${f.biz}.name`) : ''],
              [m('fields.ntn'), f.ntn],
              [m('fields.gst'), f.gst],
              [m('fields.address'), f.address],
              [m('wiz.submitted.cls'), app.class ? m(`classes.${app.class}`) : ''],
            ]}
          />
        </Card>
        <Card title={m('wiz.details.rep')}>
          <KV
            pairs={[
              [m('fields.rep'), f.rep],
              [m('fields.desig'), f.desig],
              [m('fields.cnic'), f.cnic],
              [m('fields.mobile'), f.mobile],
            ]}
          />
        </Card>
      </div>
      <Card title={msg(locale, 'endorse.slots.title')}>{endorse}</Card>
      <Card title={m('wiz.submitted.docs')}>
        <div className="slots">
          {app.requirements
            .filter((r) => w.docs.some((d) => d.key === r.key))
            .map((r) => {
              const d = w.docs.find((x) => x.key === r.key)!;
              return (
                <div key={r.key} className={`slot ${d.status === 'rejected' ? 'bad' : 'ok'}`}>
                  <div className="slot-i">{d.status === 'rejected' ? '✕' : '✓'}</div>
                  <div className="slot-b">
                    <b>{m(`docs.${r.key}`)}</b>
                    <small>{r.label_en}</small>
                    <em>{r.key === 'photo' ? m('wiz.docs.photoName') : d.file_name}</em>
                  </div>
                  <div className="slot-a">
                    {d.url && (
                      <a className="btn btn-w" href={d.url} target="_blank" rel="noreferrer" data-action="wiz.doc.view">
                        {m('wiz.docs.view')}
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
        </div>
      </Card>
    </>
  );
}
