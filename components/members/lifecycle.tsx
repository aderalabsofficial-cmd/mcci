'use client';

import { useState, useTransition } from 'react';
import { ActionNotice } from '@/components/shared/action-notice';
import { Modal } from '@/components/shared/modal';
import { DocumentUpload, SimpleForm } from '@/components/shared/simple-form';
import type { Locale } from '@/i18n/routing';
import { callAction, type Outcome } from '@/lib/client/call-action';
import {
  decideDeclaration,
  quoteRestore,
  renewMember,
  restoreMember,
  saveRenewalOpens,
  setEnrollment,
  submitDeclaration,
  type RestoreQuote,
} from '@/lib/members/actions';
import { msg } from '@/lib/nav/model';
import { useRouter } from 'next/navigation';

const CHANGE_FIELDS = ['name', 'address', 'tel', 'email', 'ntn', 'gst', 'nature_sector', 'rep_name'] as const;

function uploadError(locale: Locale) {
  return (code: string) => msg(locale, `register.life.upload.${['type', 'size', 'notAllowed'].includes(code) ? code : 'generic'}`);
}

/** The change itself: what changed, the new values, and the supporting document. Shared by the portal and renewal. */
function ChangeFields({ locale, company }: { locale: Locale; company: string }) {
  const m = (k: string) => msg(locale, `register.life.change.${k}`);
  return (
    <>
      <label className="form-field biz-wide">
        {m('summary')}
        <textarea name="summary" rows={3} required minLength={3} maxLength={1000} placeholder={m('summaryHint')} data-field="change-summary" />
      </label>
      <p className="muted biz-wide">{m('fieldsHelp')}</p>
      {CHANGE_FIELDS.map((f) => (
        <label className="form-field" key={f}>
          {m(`fields.${f}`)}
          <input name={`change_${f}`} maxLength={500} data-field={`change-${f}`} />
        </label>
      ))}
      <div className="biz-wide">
        <DocumentUpload
          route="/api/members/docs"
          label={m('document')}
          help={m('documentHelp')}
          name="documents"
          multiple
          required
          dataField="change-document"
          extra={{ company, folder: 'declarations' }}
          errorText={uploadError(locale)}
        />
      </div>
    </>
  );
}

export function RenewDialog({
  locale,
  member,
  company,
  subject,
  defaultFrom,
  defaultTo,
  canEditPeriod,
  className = 'btn btn-w',
}: {
  locale: Locale;
  member: string;
  company: string;
  subject: string;
  defaultFrom: string;
  defaultTo: string;
  canEditPeriod: boolean;
  className?: string;
}) {
  const m = (k: string, v?: Record<string, string>) => msg(locale, `register.life.renew.${k}`, v);
  const [open, setOpen] = useState(false);
  const [declaration, setDeclaration] = useState<'none' | 'change' | ''>('');
  const [answer, setAnswer] = useState<Outcome | null>(null);
  return (
    <>
      <button type="button" className={className} data-action="reg.renew" onClick={() => (setDeclaration(''), setOpen(true))}>
        {m('button')}
      </button>
      <Modal open={open} onOpenChange={setOpen} title={m('title', { subject })} intro={m('help')} closeLabel={msg(locale, 'common.close')} wide>
        <SimpleForm locale={locale} action={renewMember} className="biz-form" onDone={(r) => (setAnswer(r), setOpen(false))}>
          {(busy) => (
            <>
              <input type="hidden" name="member" value={member} />
              <input type="hidden" name="company" value={company} />
              {canEditPeriod && <input type="hidden" name="period" value="staff" />}
              <label className="form-field">
                {m('from')}
                <input type="date" name="from" defaultValue={defaultFrom} readOnly={!canEditPeriod} data-field="renew-from" />
              </label>
              <label className="form-field">
                {m('till')}
                <input type="date" name="to" defaultValue={defaultTo} readOnly={!canEditPeriod} data-field="renew-to" />
              </label>
              {canEditPeriod && (
                <label className="form-field biz-wide">
                  {m('reason')}
                  <input name="reason" maxLength={300} placeholder={m('reasonHint')} data-field="renew-reason" />
                </label>
              )}
              <fieldset className="biz-values biz-wide">
                <legend>{m('declaration')}</legend>
                <label className="biz-check">
                  <input type="radio" name="declaration" value="none" required checked={declaration === 'none'} data-field="declare-none" onChange={() => setDeclaration('none')} />
                  {m('noChange')}
                </label>
                <label className="biz-check">
                  <input type="radio" name="declaration" value="change" required checked={declaration === 'change'} data-field="declare-change" onChange={() => setDeclaration('change')} />
                  {m('hasChange')}
                </label>
              </fieldset>
              {declaration === 'change' && <ChangeFields locale={locale} company={company} />}
              <div className="pb biz-wide">
                <button className="btn btn-primary" disabled={busy} title={busy ? msg(locale, 'membership.wiz.working') : undefined} data-action="reg.renew.confirm">
                  {m('ok')}
                </button>
              </div>
            </>
          )}
        </SimpleForm>
      </Modal>
      <ActionNotice locale={locale} note={answer} />
    </>
  );
}

export function RestoreDialog({
  locale,
  member,
  company,
  subject,
  className = 'btn btn-w',
}: {
  locale: Locale;
  member: string;
  company: string;
  subject: string;
  className?: string;
}) {
  const m = (k: string, v?: Record<string, string>) => msg(locale, `register.life.restore.${k}`, v);
  const [open, setOpen] = useState(false);
  const [quote, setQuote] = useState<RestoreQuote | null>(null);
  const [answer, setAnswer] = useState<Outcome | null>(null);
  const [pending, start] = useTransition();
  return (
    <>
      <button
        type="button"
        className={className}
        data-action="reg.restore"
        disabled={pending}
        onClick={() => {
          setQuote(null);
          setOpen(true);
          start(async () => setQuote(await quoteRestore(locale, member)));
        }}
      >
        {m('button')}
      </button>
      <Modal open={open} onOpenChange={setOpen} title={m('title', { subject })} intro={m('help')} closeLabel={msg(locale, 'common.close')} wide>
        {quote === null ? (
          <p className="muted">{msg(locale, 'membership.wiz.working')}</p>
        ) : quote.ok ? (
          <>
            <table className="rep-table" data-quote>
              <tbody>
                {(quote.lines ?? []).map((l) => (
                  <tr key={l.label}>
                    <th scope="row">{l.label}</th>
                    <td>Rs. {l.amount.toLocaleString('en-PK')}</td>
                  </tr>
                ))}
                <tr data-quote-total>
                  <th scope="row">{m('total')}</th>
                  <td>
                    <b>Rs. {(quote.total ?? 0).toLocaleString('en-PK')}</b>
                  </td>
                </tr>
              </tbody>
            </table>
            <p className="muted" data-keeps-date>
              {quote.since ? m('keepsDate', { d: quote.since }) : m('noDate')}
            </p>
            <SimpleForm locale={locale} action={restoreMember} className="biz-form" onDone={(r) => (setAnswer(r), setOpen(false))}>
              {(busy) => (
                <>
                  <input type="hidden" name="member" value={member} />
                  <div className="biz-wide">
                    <DocumentUpload
                      route="/api/members/docs"
                      label={m('returns')}
                      help={m('returnsHelp')}
                      name="documents"
                      multiple
                      required
                      dataField="restore-returns"
                      extra={{ company, folder: 'taxreturns' }}
                      errorText={uploadError(locale)}
                    />
                  </div>
                  <label className="form-field biz-wide">
                    {m('reason')}
                    <input name="reason" maxLength={300} data-field="restore-reason" />
                  </label>
                  <div className="pb biz-wide">
                    <button className="btn btn-primary" disabled={busy} data-action="reg.restore.confirm">
                      {m('ok')}
                    </button>
                  </div>
                </>
              )}
            </SimpleForm>
          </>
        ) : (
          <p className="banner red" role="alert">
            {quote.message}
          </p>
        )}
      </Modal>
      <ActionNotice locale={locale} note={answer} />
    </>
  );
}

export function EnrollmentForm({
  locale,
  member,
  secp,
  fbr,
  needsReason,
}: {
  locale: Locale;
  member: string;
  secp: string | null;
  fbr: string | null;
  needsReason: boolean;
}) {
  const m = (k: string) => msg(locale, `register.life.enrollment.${k}`);
  return (
    <SimpleForm locale={locale} action={setEnrollment} className="biz-form" resetOnDone={false}>
      {(busy) => (
        <>
          <input type="hidden" name="member" value={member} />
          <label className="form-field">
            {m('secp')}
            <input type="date" name="secp" defaultValue={secp ?? ''} data-field="enroll-secp" />
          </label>
          <label className="form-field">
            {m('fbr')}
            <input type="date" name="fbr" defaultValue={fbr ?? ''} data-field="enroll-fbr" />
          </label>
          {needsReason && (
            <label className="form-field biz-wide">
              {m('reason')}
              <input name="reason" required minLength={3} maxLength={300} data-field="enroll-reason" />
            </label>
          )}
          <div className="pb biz-wide">
            <button className="btn btn-primary" disabled={busy} data-action="reg.enrollment.save">
              {m('save')}
            </button>
          </div>
        </>
      )}
    </SimpleForm>
  );
}

export function RenewalSeason({ locale, opensOn }: { locale: Locale; opensOn: string }) {
  const m = (k: string) => msg(locale, `register.life.season.${k}`);
  return (
    <SimpleForm locale={locale} action={saveRenewalOpens} className="rep-filter" resetOnDone={false}>
      {(busy) => (
        <>
          <label className="form-field">
            {m('opensOn')}
            <input type="date" name="opensOn" required defaultValue={opensOn} data-field="season-opens" />
          </label>
          <label className="form-field">
            {m('reason')}
            <input name="reason" required minLength={3} maxLength={300} placeholder={m('reasonHint')} data-field="season-reason" />
          </label>
          <button className="btn p" disabled={busy} data-action="reg.season.save">
            {m('save')}
          </button>
        </>
      )}
    </SimpleForm>
  );
}

export function DeclarationForm({ locale, company }: { locale: Locale; company: string }) {
  const m = (k: string) => msg(locale, `register.life.change.${k}`);
  const [open, setOpen] = useState(false);
  const [answer, setAnswer] = useState<Outcome | null>(null);
  return (
    <>
      <button type="button" className="btn btn-primary" data-action="chg.open" onClick={() => setOpen(true)}>
        {m('button')}
      </button>
      <Modal open={open} onOpenChange={setOpen} title={m('title')} intro={m('help')} closeLabel={msg(locale, 'common.close')} wide>
        <SimpleForm locale={locale} action={submitDeclaration} className="biz-form" onDone={(r) => (setAnswer(r), setOpen(false))}>
          {(busy) => (
            <>
              <input type="hidden" name="company" value={company} />
              <ChangeFields locale={locale} company={company} />
              <div className="pb biz-wide">
                <button className="btn btn-primary" disabled={busy} data-action="chg.submit">
                  {m('submit')}
                </button>
              </div>
            </>
          )}
        </SimpleForm>
      </Modal>
      <ActionNotice locale={locale} note={answer} />
    </>
  );
}

export function DeclarationDecision({ locale, id }: { locale: Locale; id: string }) {
  const m = (k: string) => msg(locale, `register.life.review.${k}`);
  const router = useRouter();
  const [note, setNote] = useState('');
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const [pending, start] = useTransition();
  const decide = (approve: boolean) =>
    start(async () => {
      const r = await callAction(locale, () => decideDeclaration(locale, id, approve, note));
      setOutcome(r);
      if (r.ok) router.refresh();
    });
  return (
    <div className="wa-decide" data-decide={id}>
      <label className="form-field">
        {m('note')}
        <input value={note} maxLength={500} data-field="decide-note" onChange={(e) => setNote(e.target.value)} />
      </label>
      <div className="pb">
        <button type="button" className="btn btn-primary" disabled={pending} data-action="chg.approve" onClick={() => decide(true)}>
          {m('approve')}
        </button>
        <button type="button" className="btn btn-w" disabled={pending} data-action="chg.reject" onClick={() => decide(false)}>
          {m('reject')}
        </button>
      </div>
      <ActionNotice locale={locale} note={outcome} />
    </div>
  );
}
