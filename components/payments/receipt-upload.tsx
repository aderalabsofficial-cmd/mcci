'use client';

import { Upload } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import type { Locale } from '@/i18n/routing';
import { msg } from '@/lib/nav/model';
import { type PayResult, uploadReceipt } from '@/lib/payments/actions';

/** pay.upload: photo or PDF of the paid bank slip (and the bank's transaction reference, if any) */
export function ReceiptUpload({ locale, voucher, again }: { locale: Locale; voucher: string; again: boolean }) {
  const m = (k: string) => msg(locale, `pay.upload.${k}`);
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<PayResult | null>(null);
  return (
    <form
      className="grid gap-3"
      style={{ marginTop: 14 }}
      onSubmit={async (e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        fd.set('locale', locale);
        fd.set('voucher', voucher);
        setBusy(true);
        setNote(null);
        const r = await uploadReceipt(fd);
        setBusy(false);
        setNote(r);
        if (r.ok) startTransition(() => router.refresh());
      }}
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="form-field">
          {m('file')}
          <input name="file" type="file" accept="image/jpeg,image/png,image/heic,application/pdf" required />
        </label>
        <label className="form-field">
          {m('bankRef')}
          <input name="bankRef" maxLength={80} autoComplete="off" />
        </label>
      </div>
      {note && (
        <p role={note.ok ? 'status' : 'alert'} style={{ fontWeight: 700, color: note.ok ? '#0f5b3c' : '#b91c1c' }}>
          {note.message}
        </p>
      )}
      <div className="pb">
        <button
          type="submit"
          className="btn btn-gold"
          data-action="pay.upload"
          disabled={busy}
          title={busy ? msg(locale, 'membership.wiz.working') : undefined}
        >
          <Upload size={16} aria-hidden /> {busy ? msg(locale, 'membership.wiz.working') : m(again ? 'again' : 'button')}
        </button>
      </div>
    </form>
  );
}
