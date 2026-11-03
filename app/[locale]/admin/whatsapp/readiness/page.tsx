import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { guardStaff } from '@/components/services/staff-page';
import { QuotaForm } from '@/components/whatsapp/quota-form';
import { asLocale } from '@/i18n/locale';
import { msg } from '@/lib/nav/model';
import { requireUser } from '@/lib/permissions/server';
import { loadQuota, loadSettings } from '@/lib/whatsapp/load';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return { title: msg(asLocale((await params).locale), 'screens.admin.wareadiness') };
}

export const dynamic = 'force-dynamic';

/**
 * Campaign Readiness (docs/30 §11): whether MCCI can send, and how much. Every figure says where it comes from: counted
 * by this system now, or confirmed by a person from Meta (with date and source). IQPigeon reports none of the account
 * figures, so nothing here claims to be live from Meta, and the limit is never raised from these counts.
 */
export default async function ReadinessPage({ params }: Props) {
  const locale = asLocale((await params).locale);
  setRequestLocale(locale);
  const session = await requireUser();
  const g = guardStaff(session, locale, 'out', 'screens.admin.wareadiness');
  if (g.denied) return g.denied;
  const m = (k: string, v?: Record<string, string>) => msg(locale, `wa.readiness.${k}`, v);
  const [q, settings] = await Promise.all([loadQuota(), loadSettings()]);
  const when = (iso: string | null | undefined) =>
    iso ? new Date(iso).toLocaleString(locale === 'ur' ? 'ur-PK' : 'en-GB', { timeZone: 'Asia/Karachi' }) : '—';
  const n = (v: number | null | undefined) => (v === null || v === undefined ? '—' : v.toLocaleString('en-US'));
  const confirmed = <small className="bd" data-source="confirmed">{m(`sources.${q.source}`)}</small>;
  const counted = <small className="bd green" data-source="counted">{m('counted')}</small>;
  const remaining = q.weekTarget === null ? null : Math.max(q.weekTarget - q.week, 0);
  const issues = [
    q.verification !== 'verified' && 'verification',
    q.problem && `quota_${q.problem}`,
    q.health !== 'connected' && 'connection',
    q.mastersApproved === 0 && 'templates',
    q.eligible === 0 && 'consent',
    q.statusEvents === 0 && 'statuses',
    !settings.sendingEnabled && 'sending',
  ].filter((x): x is string => Boolean(x));
  const canConfirm = (session.access.staff?.levels.plat ?? 0) >= 3;

  return (
    <div className="proto">
      <div className="ph">
        <div>
          <h1>{m('title')}</h1>
          <p>{m('sub')}</p>
        </div>
      </div>

      <div className="card" data-section="issues">
        <div className="ch">
          <h3>{m('issuesTitle')}</h3>
          <span className={`bd ${issues.length ? 'orange' : 'green'}`} data-issues={issues.length}>
            {issues.length ? m('issuesCount', { n: String(issues.length) }) : m('noIssues')}
          </span>
        </div>
        {issues.length > 0 && (
          <ul className="wa-blocked">
            {issues.map((k) => (
              <li key={k} data-issue={k}>
                {m(`issues.${k}`)}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="card" data-section="account">
        <div className="ch">
          <h3>{m('accountTitle')}</h3>
          {confirmed}
        </div>
        <div className="kv">
          <div>
            <small>{m('portfolio')}</small>
            <b dir="ltr">{q.portfolioId ?? '—'}</b>
          </div>
          <div>
            <small>{m('waba')}</small>
            <b dir="ltr">{q.wabaId ?? '—'}</b>
          </div>
          <div data-value-verification={q.verification}>
            <small>{m('verification')}</small>
            <b>{m(`verificationStates.${q.verification}`)}</b>
          </div>
          <div data-value-tier={q.tier ?? ''}>
            <small>{m('tier')}</small>
            <b dir="ltr">{q.tier ?? '—'}</b>
          </div>
          <div data-value-limit={q.limit ?? ''}>
            <small>{m('limit')}</small>
            <b>{n(q.limit)}</b>
          </div>
          <div>
            <small>{m('confirmedAt')}</small>
            <b>
              {when(q.confirmedAt)}
              {q.confirmedBy ? ` · ${q.confirmedBy}` : ''}
            </b>
          </div>
        </div>
        {q.note && <p className="muted">{q.note}</p>}
        {q.problem && (
          <p className="banner orange" data-quota-problem={q.problem}>
            {m(`problem.${q.problem}`, { days: String(q.staleDays) })}
          </p>
        )}
      </div>

      <div className="card" data-section="capacity">
        <div className="ch">
          <h3>{m('capacityTitle')}</h3>
          {counted}
        </div>
        <div className="kv">
          <div data-value-used={q.used24}>
            <small>{m('used24')}</small>
            <b>{n(q.used24)}</b>
          </div>
          <div data-value-external={q.external24}>
            <small>{m('external24')}</small>
            <b>{n(q.external24)}</b>
          </div>
          <div data-value-room={q.room}>
            <small>{m('room')}</small>
            <b>{n(q.room)}</b>
          </div>
          <div>
            <small>{m('nextFree')}</small>
            <b>{when(q.nextFreeAt)}</b>
          </div>
          <div data-value-waiting={q.waitingRecipients}>
            <small>{m('waiting')}</small>
            <b>{n(q.waitingRecipients)}</b>
          </div>
          <div data-value-eligible={q.eligible}>
            <small>{m('eligible')}</small>
            <b>{n(q.eligible)}</b>
          </div>
        </div>
        <p className="muted">{m('capacityNote')}</p>
      </div>

      <div className="card" data-section="scaling">
        <div className="ch">
          <h3>{m('scalingTitle')}</h3>
          {counted}
        </div>
        <div className="kv">
          <div data-value-week={q.week}>
            <small>{m('week')}</small>
            <b>{n(q.week)}</b>
          </div>
          <div data-value-target={q.weekTarget ?? ''}>
            <small>{m('weekTarget')}</small>
            <b>{n(q.weekTarget)}</b>
          </div>
          <div data-value-remaining={remaining ?? ''}>
            <small>{m('toTarget')}</small>
            <b>{n(remaining)}</b>
          </div>
          <div>
            <small>{m('phoneQuality')}</small>
            <b>{m(`quality.${q.phoneQuality}`)}</b>
          </div>
          <div>
            <small>{m('templateQuality')}</small>
            <b>{m(`quality.${q.templateQuality}`)}</b>
          </div>
          <div>
            <small>{m('lastTier')}</small>
            <b dir="ltr">{q.tier ?? '—'}</b>
          </div>
        </div>
        <p className="muted">{m('scalingNote')}</p>
      </div>

      <div className="card" data-section="templates">
        <div className="ch">
          <h3>{m('templatesTitle')}</h3>
          {counted}
        </div>
        <div className="kv">
          <div data-value-masters={q.mastersApproved}>
            <small>{m('mastersApproved')}</small>
            <b>{m('ofEight', { n: String(q.mastersApproved) })}</b>
          </div>
          <div>
            <small>{m('templatesApproved')}</small>
            <b>{n(q.templatesApproved)}</b>
          </div>
          <div data-value-status-events={q.statusEvents}>
            <small>{m('statusEvents')}</small>
            <b>{n(q.statusEvents)}</b>
          </div>
          <div>
            <small>{m('lastStatus')}</small>
            <b>{when(q.lastStatusAt)}</b>
          </div>
        </div>
      </div>

      {canConfirm && (
        <div className="card" data-section="confirm">
          <div className="ch">
            <h3>{m('confirmTitle')}</h3>
          </div>
          <p className="muted">{m('confirmSub')}</p>
          <QuotaForm locale={locale} q={q} />
        </div>
      )}
    </div>
  );
}
