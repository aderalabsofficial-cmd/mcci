'use client';

import { CheckCircle2, KeyRound, MessageCircle, Save, ShieldOff, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { ActionForm, Hidden } from '@/components/shared/action-form';
import { FormMessage, Modal } from '@/components/shared/modal';
import type { Locale } from '@/i18n/routing';
import type { ActionResult } from '@/lib/access/result';
import { callAction } from '@/lib/client/call-action';
import { msg } from '@/lib/nav/model';
import {
  CONSENT_CATEGORIES,
  formatWhatsapp,
  isConsented,
  STATUS_TONE,
  waWhen,
  type MyWhatsapp,
} from '@/lib/whatsapp/consent';
import {
  giveMyConsent,
  makeJoinCode,
  saveMyWhatsappContact,
  stopMyWhatsapp,
  type JoinCodeResult,
} from '@/lib/whatsapp/consent-actions';

function useNotice() {
  const router = useRouter();
  const [notice, setNotice] = useState<ActionResult | null>(null);
  const onDone = (r: ActionResult) => {
    setNotice(r);
    if (r.ok) router.refresh();
  };
  return { notice, onDone };
}

/**
 * WhatsApp Preferences (member portal, migration 0690, docs/30 §12). Four plain steps on one page: the contact, the
 * kinds of message (nothing ticked for the member), confirmation on WhatsApp, and stop. Everything the member sees is
 * their own company's, read through api.wa_my_whatsapp; every change goes through a server action and the database.
 */
export function MemberWhatsapp({ locale, company, data }: { locale: Locale; company: string; data: MyWhatsapp }) {
  const t = (k: string, v?: Record<string, string>) => msg(locale, `wa.prefs.${k}`, v);
  const L = locale === 'ur' ? 'ur' : 'en';
  const active = isConsented(data.status);
  return (
    <div className="wa-prefs" data-wa-status={data.status}>
      <section className="card" data-section="wa-status" aria-labelledby="wa-status-h">
        <div className="ch">
          <h3 id="wa-status-h">{t('status.heading')}</h3>
          <span className={`bd ${STATUS_TONE[data.status]}`} data-wa-state>
            {t(`state.${data.status}`)}
          </span>
        </div>
        <div className="kv">
          <div>
            <small>{t('status.number')}</small>
            <b dir="ltr" data-wa-phone>
              {formatWhatsapp(data.phone)}
            </b>
          </div>
          <div>
            <small>{t('status.person')}</small>
            <b>{data.name ?? '—'}</b>
          </div>
          <div>
            <small>{t('status.categories')}</small>
            <b data-wa-categories={data.categories.join(',')}>
              {data.categories.length
                ? data.categories.map((c) => msg(locale, `wa.categories.${c}`)).join(' · ')
                : t('status.none')}
            </b>
          </div>
          <div>
            <small>{data.consent_status === 'withdrawn' ? t('status.withdrawnAt') : t('status.consentAt')}</small>
            <b>{waWhen(data.consent_at, L)}</b>
          </div>
          <div>
            <small>{t('status.verified')}</small>
            <b data-wa-verified={data.verified_at ? 'yes' : 'no'}>
              {data.verified_at
                ? t('status.verifiedOn', { date: waWhen(data.verified_at, L) })
                : t('status.notVerified')}
            </b>
          </div>
          <div>
            <small>{t('status.updated')}</small>
            <b>{waWhen(data.updated_at, L)}</b>
          </div>
        </div>
        {!data.can_manage && <p className="banner blue">{t('readOnly')}</p>}
      </section>

      {data.can_manage && <ContactStep locale={locale} company={company} data={data} />}
      <ConsentStep locale={locale} company={company} data={data} />
      {data.can_manage && data.phone && data.status !== 'blocked' && (
        <VerifyStep locale={locale} company={company} data={data} />
      )}
      {data.can_manage && (active || data.status === 'awaiting_verification') && (
        <StopStep locale={locale} company={company} />
      )}
      <History locale={locale} data={data} />
    </div>
  );
}

function ContactStep({ locale, company, data }: { locale: Locale; company: string; data: MyWhatsapp }) {
  const t = (k: string, v?: Record<string, string>) => msg(locale, `wa.prefs.${k}`, v);
  const { notice, onDone } = useNotice();
  // controlled, so a refused save keeps what the member typed (a form action resets uncontrolled fields)
  const [phone, setPhone] = useState(data.phone ?? '');
  const [name, setName] = useState(data.name ?? '');
  // after a save the fields start again from what is now stored (state adjusted during render, keeping the notice)
  const stamp = `${data.phone}|${data.name}|${data.updated_at}`;
  const [seen, setSeen] = useState(stamp);
  if (seen !== stamp) {
    setSeen(stamp);
    setPhone(data.phone ?? '');
    setName(data.name ?? '');
  }
  return (
    <section className="card" data-section="wa-contact" aria-labelledby="wa-contact-h">
      <div className="ch">
        <h3 id="wa-contact-h">{t('step1.title')}</h3>
      </div>
      <p className="muted">{t('step1.help')}</p>
      <ActionForm action={saveMyWhatsappContact} onDone={onDone} className="biz-form">
        {(busy) => (
          <>
            <Hidden values={{ locale, company }} />
            <label className="form-field">
              {t('step1.name')}
              <input
                name="name"
                required
                maxLength={120}
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                data-field="wa-name"
              />
            </label>
            <label className="form-field">
              {t('step1.phone')}
              <input
                name="phone"
                required
                dir="ltr"
                inputMode="tel"
                autoComplete="tel"
                maxLength={24}
                placeholder="0300 1234567"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                data-field="wa-phone"
              />
            </label>
            {data.suggestions.length > 0 && (
              <div className="biz-wide" data-wa-suggestions>
                <small className="muted">{t('step1.suggest')}</small>
                <div className="pb" style={{ marginTop: 6 }}>
                  {data.suggestions.map((s) => (
                    <button
                      type="button"
                      key={s}
                      className="btn btn-w"
                      dir="ltr"
                      data-action="wa.prefs.suggest"
                      aria-label={t('step1.useNumber', { phone: formatWhatsapp(s) })}
                      onClick={() => setPhone(s)}
                    >
                      {formatWhatsapp(s)}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {data.phone && <small className="muted biz-wide">{t('step1.changeNote')}</small>}
            <div className="pb biz-wide">
              <button
                className="btn btn-primary"
                data-action="wa.prefs.contact"
                disabled={busy}
                title={busy ? msg(locale, 'wa.common.working') : undefined}
              >
                <Save size={15} aria-hidden /> {t('step1.save')}
              </button>
            </div>
          </>
        )}
      </ActionForm>
      {data.phone && (
        <ActionForm action={saveMyWhatsappContact} onDone={onDone} className="wa-inline">
          {(busy) => (
            <>
              <Hidden values={{ locale, company, remove: '1' }} />
              <button
                className="btn btn-w"
                data-action="wa.prefs.remove"
                disabled={busy}
                title={busy ? msg(locale, 'wa.common.working') : undefined}
              >
                <Trash2 size={15} aria-hidden /> {t('step1.remove')}
              </button>
            </>
          )}
        </ActionForm>
      )}
      {notice && <FormMessage result={notice} />}
    </section>
  );
}

function ConsentStep({ locale, company, data }: { locale: Locale; company: string; data: MyWhatsapp }) {
  const t = (k: string, v?: Record<string, string>) => msg(locale, `wa.prefs.${k}`, v);
  const { notice, onDone } = useNotice();
  // only the current, active choice is shown ticked; after an opt-out nothing is restored
  const current = new Set(isConsented(data.status) || data.status === 'awaiting_verification' ? data.categories : []);
  const canGive = data.can_manage && data.open && Boolean(data.phone) && data.status !== 'blocked';
  // controlled, so a refused submission keeps the member's ticks
  const [chosen, setChosen] = useState<Set<string>>(current);
  const [agree, setAgree] = useState(false);
  // when the consent changes (given, withdrawn, re-given) the ticks follow what is now true, never what was before
  const stamp = `${data.status}|${data.consent_at}`;
  const [seen, setSeen] = useState(stamp);
  if (seen !== stamp) {
    setSeen(stamp);
    setChosen(current);
    setAgree(false);
  }
  const toggle = (c: string) =>
    setChosen((prev) => {
      const next = new Set(prev);
      if (next.has(c)) next.delete(c);
      else next.add(c);
      return next;
    });
  return (
    <section className="card" data-section="wa-consent" aria-labelledby="wa-consent-h">
      <div className="ch">
        <h3 id="wa-consent-h">{t('step2.title')}</h3>
      </div>
      {!data.open && (
        <div className="banner orange" data-wa-closed>
          <b>{t('step2.closedTitle')}</b> {t('step2.closedBody')}
        </div>
      )}
      {data.open && !data.phone && <p className="banner blue">{t('step2.needNumber')}</p>}
      {data.status === 'blocked' && <p className="banner red">{t('step2.blocked')}</p>}
      {canGive && data.status === 'opted_out' && (
        <p className="banner blue" data-wa-reconsent>
          {t('step2.reconsent')}
        </p>
      )}
      {canGive ? (
        <ActionForm action={giveMyConsent} onDone={onDone} className="wa-consent-form">
          {(busy) => (
            <>
              <Hidden values={{ locale, company }} />
              <p className="muted">{t('step2.help')}</p>
              <fieldset className="wa-cats">
                <legend className="sr-only">{t('step2.title')}</legend>
                {CONSENT_CATEGORIES.map((c) => (
                  <label className="wa-cat" key={c}>
                    <input
                      type="checkbox"
                      name="categories"
                      value={c}
                      checked={chosen.has(c)}
                      onChange={() => toggle(c)}
                      data-category={c}
                    />
                    <span>
                      <b>{msg(locale, `wa.categories.${c}`)}</b>
                      <small>{t(`catHelp.${c}`)}</small>
                    </span>
                  </label>
                ))}
              </fieldset>
              <div className="wa-statement" data-wa-version={data.version ?? ''}>
                <small>{t('step2.statement', { version: data.version ?? '—' })}</small>
                <p>{msg(locale, 'wa.member.wording')}</p>
              </div>
              <label className="biz-check wa-agree">
                <input
                  type="checkbox"
                  name="agree"
                  checked={agree}
                  onChange={(e) => setAgree(e.target.checked)}
                  data-field="wa-agree"
                />
                {t('step2.agree')}
              </label>
              <div className="pb">
                <button
                  className="btn btn-primary"
                  data-action="wa.prefs.consent"
                  disabled={busy}
                  title={busy ? msg(locale, 'wa.common.working') : undefined}
                >
                  <CheckCircle2 size={15} aria-hidden />{' '}
                  {isConsented(data.status) ? t('step2.update') : t('step2.give')}
                </button>
              </div>
            </>
          )}
        </ActionForm>
      ) : (
        <ul className="wa-cats wa-cats-read" data-wa-categories-list>
          {CONSENT_CATEGORIES.map((c) => (
            <li className="wa-cat" key={c}>
              <span>
                <b>{msg(locale, `wa.categories.${c}`)}</b>
                <small>{t(`catHelp.${c}`)}</small>
              </span>
            </li>
          ))}
        </ul>
      )}
      {notice && <FormMessage result={notice} />}
    </section>
  );
}

function VerifyStep({ locale, company, data }: { locale: Locale; company: string; data: MyWhatsapp }) {
  const t = (k: string, v?: Record<string, string>) => msg(locale, `wa.prefs.${k}`, v);
  const L = locale === 'ur' ? 'ur' : 'en';
  const router = useRouter();
  const [code, setCode] = useState<JoinCodeResult | null>(null);
  const [pending, start] = useTransition();
  const required = data.status === 'awaiting_verification';
  const get = () =>
    start(async () => {
      const r = await callAction(locale, () => makeJoinCode(locale, company));
      setCode(r as JoinCodeResult);
    });
  // only an attempt made after the current consent concerns the member now
  const last =
    data.last_verification && data.last_verification.at > (data.consent_at ?? '') ? data.last_verification : null;
  return (
    <section className="card" data-section="wa-verify" aria-labelledby="wa-verify-h">
      <div className="ch">
        <h3 id="wa-verify-h">{t('step3.title')}</h3>
        {data.verified_at && !required && (
          <span className="bd green" data-wa-confirmed>
            <CheckCircle2 size={13} aria-hidden /> {t('status.verified')}
          </span>
        )}
      </div>
      <p className="muted">
        {t('step3.help')} {required ? <b>{t('step3.required')}</b> : t('step3.optional')}
      </p>
      {data.verified_at && !required && (
        <p className="banner green">{t('step3.done', { date: waWhen(data.verified_at, L) })}</p>
      )}
      {last && last.outcome !== 'verified' && (!data.verified_at || required) && (
        <p className="banner orange" data-wa-outcome={last.outcome}>
          {t(`outcome.${last.outcome}`)}
        </p>
      )}
      {code?.ok && code.code ? (
        <div className="wa-code-box" data-wa-code>
          <p>{t('step3.send', { phone: formatWhatsapp(data.phone) })}</p>
          <p className="wa-code" dir="ltr">
            JOIN {code.code}
          </p>
          <small className="muted">{t('step3.expires', { time: waWhen(code.expiresAt, L) })}</small>
          <div className="pb" style={{ marginTop: 8 }}>
            {code.link ? (
              <a
                className="btn btn-primary"
                href={code.link}
                target="_blank"
                rel="noopener noreferrer"
                data-action="wa.prefs.open"
              >
                <MessageCircle size={15} aria-hidden /> {t('step3.open')}
              </a>
            ) : (
              <small className="muted">{t('step3.noLink')}</small>
            )}
            <button type="button" className="btn btn-w" data-action="wa.prefs.check" onClick={() => router.refresh()}>
              {t('step3.check')}
            </button>
          </div>
          <small className="muted">{t('step3.waiting')}</small>
        </div>
      ) : (
        (!data.verified_at || required) && (
          <div className="pb">
            <button
              type="button"
              className="btn btn-primary"
              data-action="wa.prefs.code"
              disabled={pending}
              title={pending ? msg(locale, 'wa.common.working') : undefined}
              onClick={get}
            >
              <KeyRound size={15} aria-hidden /> {data.join_expires_at || last ? t('step3.again') : t('step3.get')}
            </button>
          </div>
        )
      )}
      {code && !code.ok && <FormMessage result={code} />}
    </section>
  );
}

function StopStep({ locale, company }: { locale: Locale; company: string }) {
  const t = (k: string) => msg(locale, `wa.prefs.${k}`);
  const { notice, onDone } = useNotice();
  const [open, setOpen] = useState(false);
  return (
    <section className="card" data-section="wa-stop" aria-labelledby="wa-stop-h">
      <div className="ch">
        <h3 id="wa-stop-h">{t('stop.title')}</h3>
      </div>
      <p className="muted">{t('stop.help')}</p>
      <div className="pb">
        <button type="button" className="btn btn-w wa-danger" data-action="wa.prefs.stop" onClick={() => setOpen(true)}>
          <ShieldOff size={15} aria-hidden /> {t('stop.button')}
        </button>
      </div>
      <Modal open={open} onOpenChange={setOpen} title={t('stop.confirm')} closeLabel={t('stop.cancel')}>
        <ActionForm
          action={stopMyWhatsapp}
          onDone={(r) => {
            onDone(r);
            if (r.ok) setOpen(false);
          }}
          className="pb"
        >
          {(busy) => (
            <>
              <Hidden values={{ locale, company }} />
              <button
                type="button"
                className="btn btn-w"
                data-action="wa.prefs.stop.cancel"
                onClick={() => setOpen(false)}
              >
                {t('stop.cancel')}
              </button>
              <button
                className="btn btn-primary wa-danger"
                data-action="wa.prefs.stop.confirm"
                disabled={busy}
                title={busy ? msg(locale, 'wa.common.working') : undefined}
              >
                {t('stop.yes')}
              </button>
            </>
          )}
        </ActionForm>
      </Modal>
      {notice && <FormMessage result={notice} />}
    </section>
  );
}

function History({ locale, data }: { locale: Locale; data: MyWhatsapp }) {
  const t = (k: string) => msg(locale, `wa.prefs.${k}`);
  const L = locale === 'ur' ? 'ur' : 'en';
  return (
    <details className="card wa-history" data-section="wa-history">
      <summary>
        <h3>{t('history.title')}</h3>
      </summary>
      {data.history.length === 0 ? (
        <p className="muted">{t('history.empty')}</p>
      ) : (
        <ul className="wa-events">
          {data.history.map((h, i) => (
            <li key={i} data-event={h.event}>
              <span>{waWhen(h.at, L)}</span>
              <b>{t(`events.${h.event}`)}</b>
              <small dir="auto">
                {[
                  h.detail ? msg(locale, `wa.prefs.methods.${h.detail}`) : null,
                  h.phone ? formatWhatsapp(h.phone) : null,
                  h.event === 'consent_granted' && h.categories
                    ? h.categories.map((c) => msg(locale, `wa.categories.${c}`)).join(', ')
                    : null,
                ]
                  .filter(Boolean)
                  .join(' · ')}
              </small>
            </li>
          ))}
        </ul>
      )}
    </details>
  );
}
