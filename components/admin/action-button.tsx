'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { useFlash } from '@/components/admin/flash';
import { Modal } from '@/components/shared/modal';
import type { Locale } from '@/i18n/routing';
import { msg } from '@/lib/nav/model';
import { cancelVoucher, counterPayment, reissueVoucher, rejectPayment, verifyPayment } from '@/lib/payments/actions';
import { extendTemp, issueTemp, revokeDocument, revokeTemp } from '@/lib/temp/actions';

/** staff actions of Release 5 (docs/catalogue/actions.md), each re-checked on the server and in the database */
export type StaffAction =
  | 'pay.verify'
  | 'pay.reject'
  | 'psid.markpaid'
  | 'psid.cancel'
  | 'psid.gen'
  | 'temp.issue'
  | 'temp.extend'
  | 'temp.revoke'
  | 'qr.revoke';

type Field = 'reason' | 'ref' | 'note';
const FIELDS: Record<StaffAction, Field[]> = {
  'pay.verify': [],
  'pay.reject': ['reason'],
  'psid.markpaid': ['ref', 'note'],
  'psid.cancel': ['reason'],
  'psid.gen': [],
  'temp.issue': [],
  'temp.extend': ['reason'],
  'temp.revoke': ['reason'],
  'qr.revoke': ['reason'],
};
const DANGER: StaffAction[] = ['pay.reject', 'psid.cancel', 'temp.revoke', 'qr.revoke'];

/**
 * A button that opens a short confirmation (with a reason or reference where the action needs one), runs the server
 * action and reports in the page banner (components/admin/flash.tsx). `target` is the voucher number, application id,
 * temporary-membership id or QR code the action works on; `subject` names it in the dialog.
 */
export function ActionButton({
  locale,
  action,
  target,
  subject,
  className = 'btn btn-w',
}: {
  locale: Locale;
  action: StaffAction;
  target: string;
  subject: string;
  className?: string;
}) {
  const m = (k: string, v?: Record<string, string>) => msg(locale, `staffActions.${action.replace('.', '_')}.${k}`, v);
  const router = useRouter();
  const [, startTransition] = useTransition();
  const flash = useFlash();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [values, setValues] = useState<Record<Field, string>>({ reason: '', ref: '', note: '' });
  const [error, setError] = useState<string | null>(null);

  const run = async () => {
    setBusy(true);
    setError(null);
    const v = values;
    const r =
      action === 'pay.verify'
        ? await verifyPayment(locale, target)
        : action === 'pay.reject'
          ? await rejectPayment(locale, target, v.reason)
          : action === 'psid.markpaid'
            ? await counterPayment(locale, target, v.ref, v.note)
            : action === 'psid.cancel'
              ? await cancelVoucher(locale, target, v.reason)
              : action === 'psid.gen'
                ? await reissueVoucher(locale, target)
                : action === 'temp.issue'
                  ? await issueTemp(locale, target)
                  : action === 'temp.extend'
                    ? await extendTemp(locale, target, v.reason)
                    : action === 'temp.revoke'
                      ? await revokeTemp(locale, target, v.reason)
                      : await revokeDocument(locale, target, v.reason);
    setBusy(false);
    if (!r.ok) return setError(r.message);
    setOpen(false);
    flash(r);
    startTransition(() => router.refresh());
  };

  return (
    <>
      <button
        type="button"
        className={className}
        data-action={action}
        onClick={() => {
          setValues({ reason: '', ref: '', note: '' });
          setError(null);
          setOpen(true);
        }}
      >
        {m('button')}
      </button>
      <Modal
        open={open}
        onOpenChange={setOpen}
        title={m('title', { subject })}
        intro={m('help')}
        closeLabel={msg(locale, 'common.close')}
        footer={
          <>
            <button type="button" className="btn" data-action="modal.close" onClick={() => setOpen(false)}>
              {msg(locale, 'staffActions.cancel')}
            </button>
            <button
              type="button"
              className={`btn ${DANGER.includes(action) ? 'btn-danger' : 'btn-primary'}`}
              data-action={`${action}.confirm`}
              disabled={busy}
              title={busy ? msg(locale, 'membership.wiz.working') : undefined}
              onClick={() => void run()}
            >
              {busy ? msg(locale, 'membership.wiz.working') : m('ok')}
            </button>
          </>
        }
      >
        {FIELDS[action].map((f) => (
          <label className="form-field" key={f} style={{ marginBottom: 10 }}>
            {msg(locale, `staffActions.fields.${f}`)}
            {f === 'ref' ? (
              <input value={values[f]} maxLength={80} onChange={(e) => setValues((s) => ({ ...s, [f]: e.target.value }))} />
            ) : (
              <textarea
                rows={f === 'note' ? 2 : 3}
                maxLength={500}
                value={values[f]}
                onChange={(e) => setValues((s) => ({ ...s, [f]: e.target.value }))}
              />
            )}
          </label>
        ))}
        {error && (
          <p role="alert" style={{ color: '#b91c1c', fontWeight: 700 }}>
            {error}
          </p>
        )}
      </Modal>
    </>
  );
}
