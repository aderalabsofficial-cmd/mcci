'use client';

import { Landmark } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { useFlash } from '@/components/admin/flash';
import type { Locale } from '@/i18n/routing';
import { msg } from '@/lib/nav/model';
import { saveBank } from '@/lib/payments/actions';
import type { BankSettings } from '@/lib/payments/load';
import { callAction } from '@/lib/client/call-action';

/**
 * MCCI's bank account on payment vouchers (settings.save, plat ≥ 2). Until it is confirmed, vouchers say "to be
 * confirmed by MCCI — please do not pay yet" and receipts cannot be uploaded (docs/14 item 4). Confirm only with the
 * account MCCI's Accounts have provided.
 */
export function BankCard({ locale, bank, canEdit }: { locale: Locale; bank: BankSettings | null; canEdit: boolean }) {
  const m = (k: string) => msg(locale, `pay.bank.${k}`);
  const router = useRouter();
  const [, startTransition] = useTransition();
  const flash = useFlash();
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const confirmed = bank?.confirmed === true;
  return (
    <section className="card" aria-labelledby="bank-h" data-bank={confirmed ? 'confirmed' : 'pending'}>
      <div className="ch">
        <h3 id="bank-h">
          <Landmark size={18} aria-hidden /> {m('title')}
        </h3>
        <span className={`bd ${confirmed ? 'green' : 'orange'}`}>{m(confirmed ? 'confirmed' : 'pending')}</span>
      </div>
      {confirmed ? (
        <div className="kv">
          {(
            [
              [m('bank'), bank!.name],
              [m('accountTitle'), bank!.title],
              [m('iban'), bank!.iban],
              [m('branch'), bank!.branch || '—'],
            ] as const
          ).map(([k, v]) => (
            <div key={k}>
              <small>{k}</small>
              <b>{v}</b>
            </div>
          ))}
        </div>
      ) : (
        <p className="muted">{m('pendingHelp')}</p>
      )}
      {canEdit && !editing && (
        <div className="pb" style={{ marginTop: 12 }}>
          <button type="button" className="btn btn-w" data-action="settings.save" onClick={() => (setError(null), setEditing(true))}>
            {m(confirmed ? 'change' : 'enter')}
          </button>
        </div>
      )}
      {canEdit && editing && (
        <form
          className="grid gap-3"
          style={{ marginTop: 12 }}
          onSubmit={async (e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            fd.set('locale', locale);
            setBusy(true);
            setError(null);
            const r = await callAction(locale, () => saveBank(fd));
            setBusy(false);
            if (!r.ok) return setError(r.message);
            setEditing(false);
            flash(r);
            startTransition(() => router.refresh());
          }}
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="form-field">
              {m('bank')}
              <input name="bank" required minLength={2} maxLength={120} defaultValue={confirmed ? bank!.name : ''} />
            </label>
            <label className="form-field">
              {m('accountTitle')}
              <input name="title" required minLength={2} maxLength={160} defaultValue={confirmed ? bank!.title : ''} />
            </label>
            <label className="form-field">
              {m('iban')}
              <input name="iban" required placeholder="PK36 SCBL 0000 0011 2345 6702" defaultValue={confirmed ? bank!.iban : ''} />
            </label>
            <label className="form-field">
              {m('branch')}
              <input name="branch" maxLength={120} defaultValue={confirmed ? bank!.branch : ''} />
            </label>
          </div>
          <label className="form-field">
            <span>
              <input name="confirmed" type="checkbox" /> {m('confirmBox')}
            </span>
          </label>
          {error && (
            <p role="alert" style={{ color: '#b91c1c', fontWeight: 700 }}>
              {error}
            </p>
          )}
          <div className="flex flex-wrap justify-end gap-2.5">
            <button type="button" className="btn" data-action="modal.close" onClick={() => setEditing(false)}>
              {msg(locale, 'staffActions.cancel')}
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              data-action="settings.save.confirm"
              disabled={busy}
              title={busy ? msg(locale, 'membership.wiz.working') : undefined}
            >
              {busy ? msg(locale, 'membership.wiz.working') : m('save')}
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
