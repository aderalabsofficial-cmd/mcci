'use client';

import { CheckCircle2, Save, ShieldOff } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { ActionForm, Hidden } from '@/components/shared/action-form';
import { FormMessage } from '@/components/shared/modal';
import type { Locale } from '@/i18n/routing';
import type { ActionResult } from '@/lib/access/result';
import { liftSuppression, saveContact, suppressNumber } from '@/lib/business/actions';
import { msg } from '@/lib/nav/model';
import {
  CONSENT_CATEGORIES,
  formatWhatsapp,
  STAFF_METHODS,
  STATUS_TONE,
  waWhen,
  type StaffWhatsapp,
} from '@/lib/whatsapp/consent';
import { recordConsentForMember } from '@/lib/whatsapp/consent-actions';

function useNotice() {
  const router = useRouter();
  const [notice, setNotice] = useState<ActionResult | null>(null);
  const onDone = (r: ActionResult) => {
    setNotice(r);
    if (r.ok) router.refresh();
  };
  return { notice, onDone };
}

/** the consent state as the older screens and tests name it (data-consent-state) */
const legacyState = (d: StaffWhatsapp) =>
  d.suppression ? 'opted_out' : d.phone ? (d.consent?.status ?? 'not_recorded') : 'no_contact';

/**
 * WhatsApp & Communication Preferences for one business (owner's brief, 6 Nov 2026; migration 0690). The same section
 * on the Member Record and the Business Directory profile, from api.wa_member_whatsapp: status, number (masked
 * without contact access), confirmation, categories, how and when consent was given and by whom, opt-out and the
 * full history. Staff with `out` 2 record the member's decision; the database refuses anything over the member's own
 * opt-out, without the member's explicit yes, or before MCCI has opened consent.
 */
export function StaffWhatsappSection({
  locale,
  company,
  data,
}: {
  locale: Locale;
  company: string;
  data: StaffWhatsapp;
}) {
  const t = (k: string, v?: Record<string, string>) => msg(locale, `wa.staff.${k}`, v);
  const p = (k: string, v?: Record<string, string>) => msg(locale, `wa.prefs.${k}`, v);
  const L = locale === 'ur' ? 'ur' : 'en';
  const k = data.consent;
  const memberOff = Boolean(data.suppression?.member);
  const how = data.suppression ? p(`events.suppression_${data.suppression.source}`) : '';
  return (
    <div className="wa-staff" data-section="consent" data-wa-status={data.status}>
      <div className="kv" data-consent-state={legacyState(data)}>
        <div>
          <small>{t('status')}</small>
          <b>
            <span className={`bd ${STATUS_TONE[data.status]}`} data-wa-state>
              {msg(locale, `wa.wstatus.${data.status}`)}
            </span>
          </b>
        </div>
        <div>
          <small>{t('number')}</small>
          <b dir="ltr" data-wa-phone>
            {data.full_access ? formatWhatsapp(data.phone) : (data.phone ?? '—')}
          </b>
        </div>
        <div>
          <small>{t('person')}</small>
          <b>{data.name ?? '—'}</b>
        </div>
        <div>
          <small>{t('verified')}</small>
          <b data-wa-verified={data.verified_at ? 'yes' : 'no'}>
            {data.verified_at ? t('verifiedVia', { date: waWhen(data.verified_at, L) }) : t('notVerified')}
          </b>
        </div>
        <div>
          <small>{t('categories')}</small>
          <b data-wa-categories={k?.status === 'granted' ? k.categories.join(',') : ''}>
            {k?.status === 'granted'
              ? k.categories.map((c) => msg(locale, `wa.categories.${c}`)).join(' · ')
              : t('none')}
          </b>
        </div>
        <div>
          <small>{t('method')}</small>
          <b>{k ? p(`methods.${k.method}`) : '—'}</b>
        </div>
        <div>
          <small>{t('consentAt')}</small>
          <b>{k ? `${msg(locale, `biz.profile.consentState.${k.status}`)} · ${waWhen(k.at, L)}` : '—'}</b>
        </div>
        <div>
          <small>{t('recordedBy')}</small>
          <b>{k?.who ?? (k?.method === 'member_portal' ? p('methods.member_portal') : '—')}</b>
        </div>
        <div>
          <small>{t('version')}</small>
          <b dir="ltr">{k?.version ?? '—'}</b>
        </div>
        <div>
          <small>{t('updated')}</small>
          <b>
            {data.updated_at
              ? `${waWhen(data.updated_at, L)} · ${data.source === 'member' ? t('sourceMember') : (data.updated_by ?? t('sourceStaff'))}`
              : '—'}
          </b>
        </div>
        <div>
          <small>{t('optout')}</small>
          <b>{data.suppression ? `${how} · ${waWhen(data.suppression.at, L)}` : t('none')}</b>
        </div>
      </div>
      {!data.full_access && data.phone && <p className="muted">{t('maskNote')}</p>}
      {memberOff && data.status === 'opted_out' && (
        <p className="banner red" data-member-optout>
          {t('memberOptout', { date: waWhen(data.suppression!.at, L, false), how })}
        </p>
      )}
      {data.status === 'awaiting_verification' && <p className="banner blue">{t('awaiting')}</p>}
      {data.suppression && !memberOff && (
        <div className="banner red" data-suppression>
          {msg(locale, 'biz.profile.suppressedSince')} {waWhen(data.suppression.at, L, false)}:{' '}
          {data.suppression.reason}
        </div>
      )}
      <p className="muted">{t('portal')}</p>

      {data.full_access && <ContactForm locale={locale} company={company} data={data} />}
      {data.can_record && data.phone && data.full_access && !memberOff && data.status !== 'blocked' && (
        <RecordForm locale={locale} company={company} open={data.open} />
      )}
      {data.can_record && data.phone && data.full_access && !data.suppression && (
        <BlockForm locale={locale} company={company} />
      )}
      {data.can_lift && data.suppression && !memberOff && <LiftForm locale={locale} company={company} />}

      <HistoryTable locale={locale} data={data} />
    </div>
  );
}

function ContactForm({ locale, company, data }: { locale: Locale; company: string; data: StaffWhatsapp }) {
  const t = (k: string) => msg(locale, `wa.staff.${k}`);
  const b = (k: string) => msg(locale, `biz.profile.${k}`);
  const { notice, onDone } = useNotice();
  return (
    <ActionForm action={saveContact} onDone={onDone} className="biz-form">
      {(busy) => (
        <>
          <Hidden values={{ locale, company }} />
          <label className="form-field">
            {t('person')}
            <input name="name" defaultValue={data.name ?? ''} maxLength={120} data-field="contact-name" />
          </label>
          <label className="form-field">
            {t('number')}
            <input
              name="phone"
              dir="ltr"
              inputMode="tel"
              defaultValue={data.phone ?? ''}
              placeholder="0300 1234567"
              maxLength={24}
              data-field="contact-phone"
            />
          </label>
          {data.can_record && (
            <label className="form-field">
              {b('language')}
              <select name="language" defaultValue={data.language ?? ''} data-field="contact-language">
                <option value="">{b('languageDefault')}</option>
                <option value="en">English</option>
                <option value="ur">اردو</option>
              </select>
            </label>
          )}
          <small className="muted biz-wide">{t('contact.hint')}</small>
          <div className="pb biz-wide">
            <button
              className="btn btn-w"
              data-action="biz.contact.save"
              disabled={busy}
              title={busy ? b('working') : undefined}
            >
              <Save size={15} aria-hidden /> {t('contact.save')}
            </button>
          </div>
          {notice && (
            <div className="biz-wide">
              <FormMessage result={notice} />
            </div>
          )}
        </>
      )}
    </ActionForm>
  );
}

function RecordForm({ locale, company, open }: { locale: Locale; company: string; open: boolean }) {
  const t = (k: string) => msg(locale, `wa.staff.${k}`);
  const { notice, onDone } = useNotice();
  const [status, setStatus] = useState<'granted' | 'withdrawn'>(open ? 'granted' : 'withdrawn');
  // controlled, so a refused submission keeps what was entered
  const [method, setMethod] = useState('phone');
  const [cats, setCats] = useState<string[]>([]);
  const [evidence, setEvidence] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  return (
    <ActionForm
      action={recordConsentForMember}
      onDone={(r) => {
        onDone(r);
        if (r.ok) {
          setCats([]);
          setEvidence('');
          setConfirmed(false);
        }
      }}
      className="biz-form wa-record"
    >
      {(busy) => (
        <>
          <Hidden values={{ locale, company }} />
          <h4 className="biz-wide">{t('record.title')}</h4>
          {!open && (
            <p className="banner orange biz-wide" data-wa-closed>
              {t('closedNote')}
            </p>
          )}
          <label className="form-field">
            {t('record.status')}
            <select
              name="status"
              value={status}
              onChange={(e) => setStatus(e.target.value as 'granted' | 'withdrawn')}
              data-field="consent-status"
            >
              {open && <option value="granted">{t('record.grant')}</option>}
              <option value="withdrawn">{t('record.withdraw')}</option>
            </select>
          </label>
          <label className="form-field">
            {t('record.method')}
            <select
              name="method"
              value={method}
              onChange={(e) => setMethod(e.target.value)}
              data-field="consent-method"
            >
              {STAFF_METHODS.map((k) => (
                <option key={k} value={k}>
                  {msg(locale, `wa.prefs.methods.${k}`)}
                </option>
              ))}
            </select>
          </label>
          {status === 'granted' && (
            <fieldset className="biz-values">
              <legend>{t('record.categories')}</legend>
              {CONSENT_CATEGORIES.map((c) => (
                <label className="biz-check" key={c}>
                  <input
                    type="checkbox"
                    name="categories"
                    value={c}
                    checked={cats.includes(c)}
                    onChange={(e) => setCats(e.target.checked ? [...cats, c] : cats.filter((x) => x !== c))}
                    data-category={c}
                  />
                  {msg(locale, `wa.categories.${c}`)}
                </label>
              ))}
            </fieldset>
          )}
          <label className="form-field biz-wide">
            {t('record.evidence')}
            <input
              name="evidence"
              maxLength={500}
              value={evidence}
              onChange={(e) => setEvidence(e.target.value)}
              data-field="consent-evidence"
            />
          </label>
          {status === 'granted' && (
            <label className="biz-check biz-wide wa-agree">
              <input
                type="checkbox"
                name="confirmed"
                checked={confirmed}
                onChange={(e) => setConfirmed(e.target.checked)}
                data-field="consent-confirmed"
              />
              {t('record.confirm')}
            </label>
          )}
          <div className="pb biz-wide">
            <button
              className="btn btn-primary"
              data-action="biz.consent.save"
              disabled={busy}
              title={busy ? msg(locale, 'wa.common.working') : undefined}
            >
              <CheckCircle2 size={15} aria-hidden /> {t('record.save')}
            </button>
          </div>
          {notice && (
            <div className="biz-wide">
              <FormMessage result={notice} />
            </div>
          )}
        </>
      )}
    </ActionForm>
  );
}

function BlockForm({ locale, company }: { locale: Locale; company: string }) {
  const b = (k: string) => msg(locale, `biz.profile.${k}`);
  const { notice, onDone } = useNotice();
  return (
    <ActionForm action={suppressNumber} onDone={onDone} className="biz-form">
      {(busy) => (
        <>
          <Hidden values={{ locale, company }} />
          <label className="form-field biz-wide">
            {b('suppressReason')}
            <input name="reason" maxLength={300} data-field="suppress-reason" />
          </label>
          <div className="pb biz-wide">
            <button
              className="btn btn-w"
              data-action="biz.suppress"
              disabled={busy}
              title={busy ? b('working') : undefined}
            >
              <ShieldOff size={15} aria-hidden /> {b('suppress')}
            </button>
          </div>
          {notice && (
            <div className="biz-wide">
              <FormMessage result={notice} />
            </div>
          )}
        </>
      )}
    </ActionForm>
  );
}

function LiftForm({ locale, company }: { locale: Locale; company: string }) {
  const b = (k: string) => msg(locale, `biz.profile.${k}`);
  const { notice, onDone } = useNotice();
  return (
    <ActionForm action={liftSuppression} onDone={onDone} className="biz-form">
      {(busy) => (
        <>
          <Hidden values={{ locale, company }} />
          <label className="form-field biz-wide">
            {b('liftReason')}
            <input name="reason" maxLength={300} data-field="lift-reason" />
          </label>
          <div className="pb biz-wide">
            <button
              className="btn btn-w"
              data-action="biz.unsuppress"
              disabled={busy}
              title={busy ? b('working') : undefined}
            >
              {b('lift')}
            </button>
          </div>
          {notice && (
            <div className="biz-wide">
              <FormMessage result={notice} />
            </div>
          )}
        </>
      )}
    </ActionForm>
  );
}

function HistoryTable({ locale, data }: { locale: Locale; data: StaffWhatsapp }) {
  const t = (k: string) => msg(locale, `wa.staff.${k}`);
  const L = locale === 'ur' ? 'ur' : 'en';
  const detail = (h: StaffWhatsapp['history'][number]) => {
    const parts: string[] = [];
    if (h.event.startsWith('consent_') && h.detail) parts.push(msg(locale, `wa.prefs.methods.${h.detail}`));
    else if (h.event.startsWith('contact_') && h.detail) parts.push(msg(locale, `wa.prefs.methods.${h.detail}`));
    else if (h.event.startsWith('suppression_') && h.detail) parts.push(h.detail);
    if (h.event === 'consent_granted' && h.categories)
      parts.push(h.categories.map((c) => msg(locale, `wa.categories.${c}`)).join(', '));
    if (h.evidence && h.event.startsWith('consent_')) parts.push(h.evidence);
    if (h.version && h.event.startsWith('consent_')) parts.push(`v ${h.version}`);
    return parts.join(' · ');
  };
  return (
    <>
      <h4 style={{ marginTop: 14 }}>{t('history')}</h4>
      {data.history.length === 0 ? (
        <p className="muted">{msg(locale, 'wa.prefs.history.empty')}</p>
      ) : (
        <div className="tw" tabIndex={0} role="region" aria-label={t('history')}>
          <table data-consent-history>
            <thead>
              <tr>
                {(['date', 'event', 'detail', 'number', 'by'] as const).map((c) => (
                  <th key={c} scope="col">
                    {t(`cols.${c}`)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.history.map((h, i) => (
                <tr className="st" key={i} data-event={h.event}>
                  <td>{waWhen(h.at, L)}</td>
                  <td>{msg(locale, `wa.prefs.events.${h.event}`)}</td>
                  <td dir="auto">{detail(h) || '—'}</td>
                  <td dir="ltr">{data.full_access ? formatWhatsapp(h.phone) : (h.phone ?? '—')}</td>
                  <td>{h.who ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
