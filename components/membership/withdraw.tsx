'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Modal } from '@/components/shared/modal';
import type { Locale } from '@/i18n/routing';
import { withdrawApplication } from '@/lib/membership/actions';
import { msg } from '@/lib/nav/model';

/** "Withdraw application" (docs/03 §1 withdraw): asks first, with an optional reason (api.app_withdraw). */
export function WithdrawButton({ locale, appId }: { locale: Locale; appId: string }) {
  const m = (k: string) => msg(locale, `membership.wiz.submitted.${k}`);
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  return (
    <>
      <button type="button" className="btn" data-action="app.withdraw" onClick={() => setOpen(true)}>
        {m('withdraw')}
      </button>
      <Modal
        open={open}
        onOpenChange={setOpen}
        title={m('withdrawTitle')}
        intro={m('withdrawHelp')}
        closeLabel={msg(locale, 'common.close')}
        footer={
          <>
            <button type="button" className="btn" onClick={() => setOpen(false)} data-action="modal.close">
              {m('cancel')}
            </button>
            <button
              type="button"
              className="btn btn-danger"
              disabled={busy}
              data-action="app.withdraw.confirm"
              onClick={async () => {
                setBusy(true);
                const r = await withdrawApplication(locale, appId, reason);
                setBusy(false);
                if (!r.ok) return setError(r.message ?? '');
                setOpen(false);
                router.refresh();
              }}
            >
              {busy ? msg(locale, 'membership.wiz.working') : m('confirm')}
            </button>
          </>
        }
      >
        <label className="form-field">
          {m('reason')}
          <textarea value={reason} maxLength={500} rows={3} onChange={(e) => setReason(e.target.value)} />
        </label>
        {error && (
          <p role="alert" style={{ color: '#b91c1c', fontWeight: 700 }}>
            {error}
          </p>
        )}
      </Modal>
    </>
  );
}
