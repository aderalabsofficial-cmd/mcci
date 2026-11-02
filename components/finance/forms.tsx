'use client';

import { Printer, Save } from 'lucide-react';
import { useState } from 'react';
import { DocumentUpload, SimpleForm } from '@/components/shared/simple-form';
import { RunAction } from '@/components/whatsapp/controls';
import { Modal } from '@/components/shared/modal';
import { ActionNotice } from '@/components/shared/action-notice';
import type { Locale } from '@/i18n/routing';
import { callAction, type Outcome } from '@/lib/client/call-action';
import { addAccount, addEntry, saveBankBalance, saveOpening, setMonth, verifyEntry, voidEntry } from '@/lib/finance/actions';
import type { FinAccount, FinGroup } from '@/lib/finance/statement';
import { msg } from '@/lib/nav/model';
import { useRouter } from 'next/navigation';

const uploadError = (locale: Locale) => (code: string) => {
  const k = ['type', 'size', 'notAllowed'].includes(code) ? code : 'generic';
  return msg(locale, `fin.upload.${k}`);
};

export function PrintButton({ label }: { label: string }) {
  return (
    <button type="button" className="btn" data-action="fin.print" onClick={() => window.print()}>
      <Printer size={15} aria-hidden /> {label}
    </button>
  );
}

/** Receipts and expenses are two tabs of one form: the account list follows the tab. */
export function EntryForm({
  locale,
  groups,
  accounts,
  banks,
  today,
}: {
  locale: Locale;
  groups: FinGroup[];
  accounts: FinAccount[];
  banks: { id: string; name: string; is_default: boolean }[];
  today: string;
}) {
  const m = (k: string) => msg(locale, `fin.entry.${k}`);
  const name = (x: { name_en: string; name_ur: string | null }) => (locale === 'ur' && x.name_ur ? x.name_ur : x.name_en);
  const [kind, setKind] = useState<'expense' | 'receipt'>('expense');
  const list = groups.filter((g) => g.kind === kind);
  const def = banks.find((b) => b.is_default)?.id ?? '';
  return (
    <div className="card" data-section="fin-entry">
      <div className="ch">
        <h3>{m('title')}</h3>
      </div>
      <div className="pills" role="group" aria-label={m('kind')}>
        {(['expense', 'receipt'] as const).map((k) => (
          <button
            key={k}
            type="button"
            className={`pill ${kind === k ? 'on' : ''}`}
            aria-pressed={kind === k}
            data-action={`fin.kind.${k}`}
            onClick={() => setKind(k)}
          >
            {m(`kind_${k}`)}
          </button>
        ))}
      </div>
      {kind === 'receipt' && <p className="muted">{m('autoNote')}</p>}
      <SimpleForm locale={locale} action={addEntry} className="biz-form">
        {(busy) => (
          <>
            <label className="form-field biz-wide">
              {m('account')}
              <select name="account" required data-field="fin-account" defaultValue="">
                <option value="" disabled>
                  {m('pickAccount')}
                </option>
                {list.map((g) => (
                  <optgroup key={g.code} label={`${g.code === 'R' ? '' : `(${g.code}) `}${name(g)}`}>
                    {accounts
                      .filter((a) => a.group_code === g.code && a.active)
                      .map((a) => (
                        <option key={a.id} value={a.id}>
                          {name(a)}
                        </option>
                      ))}
                  </optgroup>
                ))}
              </select>
            </label>
            <label className="form-field">
              {m('amount')}
              <input name="amount" required inputMode="decimal" placeholder="0.00" data-field="fin-amount" />
            </label>
            <label className="form-field">
              {m('date')}
              <input type="date" name="date" required max={today} defaultValue={today} data-field="fin-date" />
            </label>
            <label className="form-field">
              {m('bank')}
              <select name="bank" defaultValue={def} data-field="fin-bank">
                {banks.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
                <option value="">{m('cash')}</option>
              </select>
            </label>
            <label className="form-field">
              {m('party')}
              <input name="party" maxLength={200} data-field="fin-party" />
            </label>
            <label className="form-field">
              {m('reference')}
              <input name="reference" maxLength={120} data-field="fin-reference" />
            </label>
            <DocumentUpload
              route="/api/finance/attachments"
              label={m('attachment')}
              help={m('attachmentHelp')}
              dataField="fin-attachment"
              errorText={uploadError(locale)}
            />
            <label className="form-field biz-wide">
              {m('note')}
              <textarea name="note" rows={2} maxLength={1000} data-field="fin-note" />
            </label>
            <div className="pb biz-wide">
              <button className="btn btn-primary" disabled={busy} data-action="fin.entry.save">
                <Save size={15} aria-hidden /> {m('save')}
              </button>
            </div>
          </>
        )}
      </SimpleForm>
    </div>
  );
}

export function EntryActions({ locale, id, no, canVerify, canVoid }: { locale: Locale; id: string; no: string; canVerify: boolean; canVoid: boolean }) {
  const m = (k: string, v?: Record<string, string>) => msg(locale, `fin.entry.${k}`, v);
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [why, setWhy] = useState('');
  const [note, setNote] = useState<Outcome | null>(null);
  const [busy, setBusy] = useState(false);
  return (
    <div className="pb" data-entry-actions={no}>
      {canVerify && (
        <RunAction locale={locale} action={() => verifyEntry(locale, id)} label={m('verify')} dataAction="fin.entry.verify" />
      )}
      {canVoid && (
        <button type="button" className="btn btn-w" data-action="fin.entry.void" onClick={() => setOpen(true)}>
          {m('void')}
        </button>
      )}
      <Modal
        open={open}
        onOpenChange={setOpen}
        title={m('voidTitle', { no })}
        intro={m('voidHelp')}
        closeLabel={msg(locale, 'common.close')}
        footer={
          <button
            type="button"
            className="btn btn-danger"
            data-action="fin.entry.void.confirm"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              const r = await callAction(locale, () => voidEntry(locale, id, why));
              setBusy(false);
              setNote(r);
              if (r.ok) {
                setOpen(false);
                router.refresh();
              }
            }}
          >
            {m('void')}
          </button>
        }
      >
        <label className="form-field">
          {m('voidReason')}
          <textarea rows={2} maxLength={1000} value={why} data-field="fin-void-reason" onChange={(e) => setWhy(e.target.value)} />
        </label>
        <ActionNotice locale={locale} note={note} />
      </Modal>
    </div>
  );
}

export function SetupForms({
  locale,
  groups,
  banks,
  openingOn,
  thisMonth,
  closed,
  level,
}: {
  locale: Locale;
  groups: FinGroup[];
  banks: { id: string; name: string }[];
  openingOn: string;
  thisMonth: string;
  closed: string[];
  level: number;
}) {
  const m = (k: string) => msg(locale, `fin.setup.${k}`);
  const name = (x: { name_en: string; name_ur: string | null }) => (locale === 'ur' && x.name_ur ? x.name_ur : x.name_en);
  const bankSelect = (
    <label className="form-field">
      {m('bank')}
      <select name="bank" required>
        {banks.map((b) => (
          <option key={b.id} value={b.id}>
            {b.name}
          </option>
        ))}
      </select>
    </label>
  );
  return (
    <div className="gr rep-grid">
      {level >= 2 && (
        <section className="card" data-section="fin-balance">
          <div className="ch">
            <h3>{m('balanceTitle')}</h3>
          </div>
          <p className="muted">{m('balanceHelp')}</p>
          <SimpleForm locale={locale} action={saveBankBalance} className="biz-form">
            {(busy) => (
              <>
                {bankSelect}
                <label className="form-field">
                  {m('month')}
                  <input type="month" name="month" required defaultValue={thisMonth} data-field="fin-balance-month" />
                </label>
                <label className="form-field biz-wide">
                  {m('balance')}
                  <input name="balance" required inputMode="decimal" data-field="fin-balance" />
                </label>
                <div className="pb biz-wide">
                  <button className="btn btn-primary" disabled={busy} data-action="fin.balance.save">
                    {m('save')}
                  </button>
                </div>
              </>
            )}
          </SimpleForm>
        </section>
      )}
      {level >= 3 && (
        <section className="card" data-section="fin-opening">
          <div className="ch">
            <h3>{m('openingTitle')}</h3>
          </div>
          <p className="muted">{m('openingHelp')}</p>
          <SimpleForm locale={locale} action={saveOpening} className="biz-form">
            {(busy) => (
              <>
                {bankSelect}
                <label className="form-field">
                  {m('openingOn')}
                  <input type="date" name="openingOn" required defaultValue={openingOn} data-field="fin-opening-on" />
                </label>
                <label className="form-field">
                  {m('opening')}
                  <input name="opening" required inputMode="decimal" data-field="fin-opening" />
                </label>
                <label className="form-field">
                  {m('reason')}
                  <input name="reason" required minLength={3} maxLength={300} data-field="fin-opening-reason" />
                </label>
                <div className="pb biz-wide">
                  <button className="btn btn-primary" disabled={busy} data-action="fin.opening.save">
                    {m('save')}
                  </button>
                </div>
              </>
            )}
          </SimpleForm>
        </section>
      )}
      {level >= 3 && (
        <section className="card" data-section="fin-account">
          <div className="ch">
            <h3>{m('accountTitle')}</h3>
          </div>
          <p className="muted">{m('accountHelp')}</p>
          <SimpleForm locale={locale} action={addAccount} className="biz-form">
            {(busy) => (
              <>
                <label className="form-field biz-wide">
                  {m('group')}
                  <select name="group" required data-field="fin-account-group">
                    {groups.map((g) => (
                      <option key={g.code} value={g.code}>
                        {g.code === 'R' ? '' : `(${g.code}) `}
                        {name(g)}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="form-field">
                  {m('nameEn')}
                  <input name="name" required minLength={2} maxLength={200} data-field="fin-account-name" />
                </label>
                <label className="form-field">
                  {m('nameUr')}
                  <input name="name_ur" dir="rtl" maxLength={200} data-field="fin-account-name-ur" />
                </label>
                <div className="pb biz-wide">
                  <button className="btn btn-primary" disabled={busy} data-action="fin.account.save">
                    {m('addAccount')}
                  </button>
                </div>
              </>
            )}
          </SimpleForm>
        </section>
      )}
      {level >= 3 && (
        <section className="card" data-section="fin-close">
          <div className="ch">
            <h3>{m('closeTitle')}</h3>
          </div>
          <p className="muted">{m('closeHelp')}</p>
          <SimpleForm locale={locale} action={setMonth} className="biz-form">
            {(busy) => (
              <>
                <label className="form-field">
                  {m('month')}
                  <input type="month" name="month" required defaultValue={thisMonth} data-field="fin-close-month" />
                </label>
                <label className="form-field">
                  {m('action')}
                  <select name="closed" data-field="fin-close-action">
                    <option value="1">{m('close')}</option>
                    <option value="0">{m('reopen')}</option>
                  </select>
                </label>
                <label className="form-field biz-wide">
                  {m('reason')}
                  <input name="note" required minLength={3} maxLength={300} data-field="fin-close-note" />
                </label>
                <div className="pb biz-wide">
                  <button className="btn btn-primary" disabled={busy} data-action="fin.month.save">
                    {m('save')}
                  </button>
                </div>
              </>
            )}
          </SimpleForm>
          {closed.length > 0 && (
            <p className="muted" data-closed-months>
              {m('closedList')} {closed.map((c) => c.slice(0, 7)).join(', ')}
            </p>
          )}
        </section>
      )}
    </div>
  );
}
