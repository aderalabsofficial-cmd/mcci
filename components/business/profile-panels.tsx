'use client';

import { Plus, Save, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { ActionForm, Hidden } from '@/components/shared/action-form';
import { FormMessage } from '@/components/shared/modal';
import { StaffConsentForm } from '@/components/whatsapp/forms';
import type { Locale } from '@/i18n/routing';
import type { ActionResult } from '@/lib/access/result';
import {
  addTag,
  liftSuppression,
  removeTag,
  saveContact,
  saveOutreachDetails,
  suppressNumber,
} from '@/lib/business/actions';
import type { BusinessProfile, Facets } from '@/lib/business/load';
import { msg } from '@/lib/nav/model';

type Done = (r: ActionResult) => void;

function useNotice() {
  const router = useRouter();
  const [notice, setNotice] = useState<ActionResult | null>(null);
  const onDone: Done = (r) => {
    setNotice(r);
    if (r.ok) router.refresh();
  };
  return { notice, onDone };
}

/** outreach details: MCCI's own working data, kept apart from the official record */
export function OutreachDetails({ locale, p, canEdit }: { locale: Locale; p: BusinessProfile; canEdit: boolean }) {
  const m = (k: string) => msg(locale, `biz.profile.${k}`);
  const { notice, onDone } = useNotice();
  if (!canEdit) {
    return (
      <div className="kv">
        <div>
          <small>{msg(locale, 'biz.columns.city')}</small>
          <b>{p.outreach?.city ?? '—'}</b>
        </div>
        <div>
          <small>{msg(locale, 'biz.columns.district')}</small>
          <b>{p.outreach?.district ?? '—'}</b>
        </div>
      </div>
    );
  }
  return (
    <ActionForm action={saveOutreachDetails} onDone={onDone} className="biz-form">
      {(busy) => (
        <>
          <Hidden values={{ locale, company: p.company_id }} />
          <label className="form-field">
            {msg(locale, 'biz.columns.city')}
            <input name="city" defaultValue={p.outreach?.city ?? ''} maxLength={80} data-field="city" />
          </label>
          <label className="form-field">
            {msg(locale, 'biz.columns.district')}
            <input name="district" defaultValue={p.outreach?.district ?? ''} maxLength={80} data-field="district" />
          </label>
          <label className="form-field biz-wide">
            {m('notes')}
            <textarea
              name="notes"
              defaultValue={p.outreach?.notes ?? ''}
              maxLength={1000}
              rows={2}
              data-field="notes"
            />
          </label>
          <div className="pb biz-wide">
            <button
              className="btn btn-primary"
              data-action="biz.details.save"
              disabled={busy}
              title={busy ? m('working') : undefined}
            >
              <Save size={15} aria-hidden /> {m('saveDetails')}
            </button>
          </div>
          {notice && <FormMessage result={notice} />}
        </>
      )}
    </ActionForm>
  );
}

export function TagPanel({
  locale,
  p,
  facets,
  canEdit,
}: {
  locale: Locale;
  p: BusinessProfile;
  facets: Facets;
  canEdit: boolean;
}) {
  const m = (k: string) => msg(locale, `biz.profile.${k}`);
  const { notice, onDone } = useNotice();
  const have = new Set(p.tags.map((t) => t.id));
  const free = facets.tags.filter((t) => !have.has(t.id));
  return (
    <>
      {p.tags.length === 0 && <p className="muted">{m('noTags')}</p>}
      <ul className="biz-chips" data-tags>
        {p.tags.map((t) => (
          <li className="chip" key={t.id} data-tag={t.name}>
            {t.name}
            {canEdit && (
              <ActionForm action={removeTag} onDone={onDone} className="biz-inline">
                {(busy) => (
                  <>
                    <Hidden values={{ locale, company: p.company_id, tag: t.id }} />
                    <button
                      className="biz-x"
                      aria-label={`${m('removeTag')}: ${t.name}`}
                      data-action="biz.tag.remove"
                      disabled={busy}
                      title={busy ? m('working') : m('removeTag')}
                    >
                      <X size={13} aria-hidden />
                    </button>
                  </>
                )}
              </ActionForm>
            )}
          </li>
        ))}
      </ul>
      {canEdit && (
        <ActionForm action={addTag} onDone={onDone} className="biz-form">
          {(busy) => (
            <>
              <Hidden values={{ locale, company: p.company_id }} />
              {free.length > 0 && (
                <label className="form-field">
                  {m('existingTag')}
                  <select name="tag" defaultValue="" data-field="tag">
                    <option value="">{m('newTagOption')}</option>
                    {free.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </label>
              )}
              <label className="form-field">
                {m('newTag')}
                <input name="name" maxLength={40} data-field="tag-name" />
              </label>
              <div className="pb biz-wide">
                <button
                  className="btn btn-w"
                  data-action="biz.tag.add"
                  disabled={busy}
                  title={busy ? m('working') : undefined}
                >
                  <Plus size={15} aria-hidden /> {m('addTag')}
                </button>
              </div>
            </>
          )}
        </ActionForm>
      )}
      {notice && <FormMessage result={notice} />}
    </>
  );
}

/** WhatsApp contact, consent and suppression. Hidden from anyone without contact access (checked in the database too). */
export function ConsentPanel({
  locale,
  p,
  canManage,
  canLift,
}: {
  locale: Locale;
  p: BusinessProfile;
  canManage: boolean;
  canLift: boolean;
}) {
  const m = (k: string) => msg(locale, `biz.profile.${k}`);
  const { notice, onDone } = useNotice();
  const date = (iso: string) =>
    new Date(iso).toLocaleDateString(locale === 'ur' ? 'ur-PK' : 'en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  const phone = p.whatsapp?.phone;
  return (
    <>
      <div className="kv" data-consent-state={p.opted_out ? 'opted_out' : p.consent}>
        <div>
          <small>{m('consentStatus')}</small>
          <b>{p.opted_out ? m('optedOut') : msg(locale, `biz.values.consent.${p.consent}`)}</b>
        </div>
        <div>
          <small>{m('whatsappNumber')}</small>
          <b dir="ltr">{phone ?? '—'}</b>
        </div>
      </div>
      <ActionForm action={saveContact} onDone={onDone} className="biz-form">
        {(busy) => (
          <>
            <Hidden values={{ locale, company: p.company_id }} />
            <label className="form-field">
              {m('contactName')}
              <input name="name" defaultValue={p.whatsapp?.name ?? ''} maxLength={120} data-field="contact-name" />
            </label>
            <label className="form-field">
              {m('whatsappNumber')}
              <input
                name="phone"
                dir="ltr"
                defaultValue={phone ?? ''}
                placeholder="+923001234567"
                maxLength={24}
                data-field="contact-phone"
              />
            </label>
            {canManage && (
              <label className="form-field">
                {m('language')}
                <select name="language" defaultValue={p.whatsapp?.language ?? ''} data-field="contact-language">
                  <option value="">{m('languageDefault')}</option>
                  <option value="en">English</option>
                  <option value="ur">اردو</option>
                </select>
              </label>
            )}
            <small className="muted biz-wide">{m('numberHint')}</small>
            <div className="pb biz-wide">
              <button
                className="btn btn-w"
                data-action="biz.contact.save"
                disabled={busy}
                title={busy ? m('working') : undefined}
              >
                <Save size={15} aria-hidden /> {m('saveContact')}
              </button>
            </div>
          </>
        )}
      </ActionForm>

      {canManage && phone && !p.opted_out && <StaffConsentForm locale={locale} company={p.company_id} />}

      {canManage && phone && !p.opted_out && (
        <ActionForm action={suppressNumber} onDone={onDone} className="biz-form">
          {(busy) => (
            <>
              <Hidden values={{ locale, company: p.company_id }} />
              <label className="form-field biz-wide">
                {m('suppressReason')}
                <input name="reason" maxLength={300} data-field="suppress-reason" />
              </label>
              <div className="pb biz-wide">
                <button
                  className="btn btn-w"
                  data-action="biz.suppress"
                  disabled={busy}
                  title={busy ? m('working') : undefined}
                >
                  {m('suppress')}
                </button>
              </div>
            </>
          )}
        </ActionForm>
      )}

      {p.suppression && (
        <div className="banner red" data-suppression>
          {m('suppressedSince')} {date(p.suppression.created_at)}: {p.suppression.reason}
        </div>
      )}
      {p.suppression && canLift && (
        <ActionForm action={liftSuppression} onDone={onDone} className="biz-form">
          {(busy) => (
            <>
              <Hidden values={{ locale, company: p.company_id }} />
              <label className="form-field biz-wide">
                {m('liftReason')}
                <input name="reason" maxLength={300} data-field="lift-reason" />
              </label>
              <div className="pb biz-wide">
                <button
                  className="btn btn-w"
                  data-action="biz.unsuppress"
                  disabled={busy}
                  title={busy ? m('working') : undefined}
                >
                  {m('lift')}
                </button>
              </div>
            </>
          )}
        </ActionForm>
      )}

      {notice && <FormMessage result={notice} />}

      {(p.consents?.length ?? 0) > 0 && (
        <div className="tw" tabIndex={0} role="region" aria-label={m('consentHistory')}>
          <table data-consent-history>
            <thead>
              <tr>
                {(['date', 'status', 'method', 'evidence', 'number'] as const).map((c) => (
                  <th key={c} scope="col">
                    {m(`consentCols.${c}`)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {p.consents!.map((c, i) => (
                <tr className="st" key={i}>
                  <td>{date(c.recorded_at)}</td>
                  <td>{m(`consentState.${c.status}`)}</td>
                  <td>{m(`methods.${c.method}`)}</td>
                  <td>{c.evidence ?? '—'}</td>
                  <td>{m(c.current_number ? 'numberCurrent' : 'numberOld')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
