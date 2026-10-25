import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { ActionButton } from '@/components/admin/action-button';
import { FlashProvider } from '@/components/admin/flash';
import { NoAccess } from '@/components/admin/no-access';
import { Ic } from '@/components/membership/ui';
import { Kpi } from '@/components/review/kpi';
import { PageHeader } from '@/components/shared/page-header';
import { Link } from '@/i18n/navigation';
import { asLocale } from '@/i18n/locale';
import { voucherDate } from '@/lib/committee/voucher';
import { msg } from '@/lib/nav/model';
import { staffLevel } from '@/lib/permissions/levels';
import { requireUser } from '@/lib/permissions/server';
import { loadTempPolicy, loadTemps } from '@/lib/temp/load';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return { title: msg(asLocale((await params).locale), 'temp.admin.title') };
}

export const dynamic = 'force-dynamic';

const daysLeft = (iso: string) => Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000);

/**
 * Temporary Memberships (prototype admin/temp): issued when the fee is verified, valid settings.temp.days, alerts and
 * expiry by the daily job; the SG extends or revokes (temp ≥ 3); paid files waiting for issue (temp ≥ 2). Printing,
 * receiving and conversion to permanent come with Release 6.
 */
export default async function TempPage({ params }: Props) {
  const locale = asLocale((await params).locale);
  setRequestLocale(locale);
  const session = await requireUser();
  const level = staffLevel(session.access, 'temp');
  const m = (k: string, v?: Record<string, string>) => msg(locale, `temp.admin.${k}`, v);
  if (level < 1) {
    return (
      <>
        <PageHeader locale={locale} title={{ en: msg('en', 'temp.admin.title'), ur: msg('ur', 'temp.admin.title') }} bilingual={false} />
        <NoAccess locale={locale} designation={session.access.staff?.designation ?? ''} module="temp" />
      </>
    );
  }
  const [{ temps, waiting }, policy] = await Promise.all([loadTemps(), loadTempPolicy()]);
  const tempDays = policy.days;
  const alert1 = policy.alert1;
  const active = temps.filter((t) => t.status === 'active');
  const steps: [string, string][] = [
    ['card', 'paid'],
    ['hourglass', 'issued'],
    ['printer', 'printing'],
    ['upload', 'received'],
    ['check', 'permanent'],
  ];

  return (
    <div className="proto">
      <FlashProvider>
        <div className="ph">
          <div>
            <h1>{m('title')}</h1>
            <p>{m('sub', { days: String(tempDays) })}</p>
          </div>
          <div className="pb">
            <Link className="btn" href="/admin/documents" data-action="nav">
              <Ic name="shield" /> {m('registry')}
            </Link>
          </div>
        </div>
        <div className="kg">
          <Kpi label={m('kActive')} value={active.length} sub={m('kActiveSub')} icon="hourglass" color="#14b8a6" />
          <Kpi
            label={m('kExpiring', { n: String(alert1) })}
            value={active.filter((t) => daysLeft(t.expires_at) <= alert1).length}
            icon="clock"
            color="#f59e0b"
          />
          <Kpi label={m('kExpired')} value={temps.filter((t) => t.status === 'expired').length} sub={m('kExpiredSub')} icon="ban" color="#ef4444" />
          <Kpi label={m('kWaiting')} value={waiting.length} sub={m('kWaitingSub')} icon="card" color="#3b82f6" />
        </div>
        <div className="card tmp-flow" style={{ marginBottom: 18 }}>
          <div className="ch">
            <h3>{m('how')}</h3>
          </div>
          <div className="tflow">
            {steps.map(([icon, k], i) => (
              <div key={k}>
                <i>
                  <Ic name={icon} color="#fff" size={20} />
                </i>
                <b>
                  {i + 1}. {m(`steps.${k}.t`)}
                </b>
                <small>{m(`steps.${k}.d`, { days: String(tempDays) })}</small>
              </div>
            ))}
          </div>
        </div>
        <div className="card" style={{ marginBottom: 18 }}>
          <div className="ch">
            <h3>{m('table')}</h3>
          </div>
          <div className="tw" tabIndex={0} role="region" aria-label={m('table')}>
            <table>
              <thead>
                <tr>
                  {(['no', 'company', 'issued', 'expires', 'left', 'print', 'status'] as const).map((c) => (
                    <th key={c} scope="col">
                      {m(`cols.${c}`)}
                    </th>
                  ))}
                  <th scope="col">{m('cols.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {temps.map((t) => {
                  const left = daysLeft(t.expires_at);
                  return (
                    <tr className="st" key={t.id} data-temp={t.member_no}>
                      <td>
                        <b>{t.member_no}</b>
                      </td>
                      <td>{t.company}</td>
                      <td>{voucherDate(t.issued_at, locale)}</td>
                      <td>
                        {voucherDate(t.expires_at, locale)}
                        {t.extensions ? ` ${m('extended')}` : ''}
                      </td>
                      <td>{t.status === 'active' ? m('daysLeft', { n: String(Math.max(0, left)) }) : '—'}</td>
                      <td>{t.print ? m(`print.${t.print.split(' ')[0]}`) + (t.print.includes('·') ? ` · ${t.print.split('· ')[1]}` : '') : '—'}</td>
                      <td>
                        <span className={`bd ${t.status === 'active' ? (left <= alert1 ? 'orange' : 'green') : t.status === 'converted' ? 'blue' : 'red'}`}>
                          {m(`status.${t.status}`)}
                        </span>
                      </td>
                      <td>
                        <div className="pb">
                          {t.code && (
                            <Link className="btn btn-w" href={`/admin/documents?code=${t.code}`} data-action="qr.view">
                              {m('certificate')}
                            </Link>
                          )}
                          {level >= 3 && (t.status === 'active' || t.status === 'expired') && (
                            <>
                              <ActionButton locale={locale} action="temp.extend" target={t.id} subject={`${t.member_no} · ${t.company}`} />
                              <ActionButton locale={locale} action="temp.revoke" target={t.id} subject={`${t.member_no} · ${t.company}`} />
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {!temps.length && (
                  <tr className="st">
                    <td colSpan={8} className="em">
                      {m('none')}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        <div className="card">
          <div className="ch">
            <h3>{m('waiting')}</h3>
          </div>
          {waiting.length ? (
            waiting.map((w) => (
              <div className="agenda" key={w.appId}>
                <div>
                  <b>{w.name || w.token}</b>
                  <small>
                    {w.member_no} · {m('paidOn', { date: w.paid_at ? voucherDate(w.paid_at, locale) : '—' })}
                  </small>
                </div>
                {level >= 2 && (
                  <div className="pb">
                    <ActionButton locale={locale} action="temp.issue" target={w.appId} subject={w.name || w.token} className="btn btn-w btn-primary" />
                  </div>
                )}
              </div>
            ))
          ) : (
            <p className="em">{m(policy.autoIssue ? 'waitingAuto' : 'waitingNone')}</p>
          )}
        </div>
      </FlashProvider>
    </div>
  );
}
