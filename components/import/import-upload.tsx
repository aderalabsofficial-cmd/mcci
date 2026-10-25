'use client';

import { Download, Upload } from 'lucide-react';
import { useState } from 'react';
import { ActionNotice } from '@/components/shared/action-notice';
import { Modal } from '@/components/shared/modal';
import { useRouter } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';
import { callAction, type Outcome } from '@/lib/client/call-action';
import { uploadImport } from '@/lib/import/actions';
import { TEMPLATE_HEADERS } from '@/lib/import/normalize';
import { msg } from '@/lib/nav/model';

/** reading a PDF with AI takes longer than other actions (the server gives up after 50 s, nginx after 60 s) */
const UPLOAD_TIMEOUT_MS = 65_000;
export const IMPORT_NOTE_KEY = 'mcci.import.note';

const TEMPLATE = `data:text/csv;charset=utf-8,${encodeURIComponent(`${TEMPLATE_HEADERS.join(',')}\r\n`)}`;

/** imp.template + imp.file: the template download and the upload dialog (a PDF needs the AI consent tick) */
export function ImportUpload({ locale, aiOn }: { locale: Locale; aiOn: boolean }) {
  const m = (k: string) => msg(locale, `imp.${k}`);
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [pdf, setPdf] = useState(false);
  const [note, setNote] = useState<Outcome | null>(null);
  return (
    <>
      <a className="btn" href={TEMPLATE} download="mcci_member_import_template.csv" data-action="imp.template">
        <Download size={16} aria-hidden /> {m('template')}
      </a>
      <button type="button" className="btn btn-primary" data-action="imp.file" onClick={() => (setNote(null), setPdf(false), setOpen(true))}>
        <Upload size={16} aria-hidden /> {m('upload')}
      </button>
      <Modal open={open} onOpenChange={(o) => !busy && setOpen(o)} title={m('uploadTitle')} intro={m('uploadHelp')} closeLabel={msg(locale, 'common.close')}>
        <form
          className="grid gap-3"
          onSubmit={async (e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            fd.set('locale', locale);
            setBusy(true);
            setNote(null);
            const r = await callAction(locale, () => uploadImport(fd), UPLOAD_TIMEOUT_MS);
            setBusy(false);
            if (!r.ok) return setNote(r);
            setOpen(false);
            const id = (r as Outcome & { id?: string }).id;
            try {
              // the preview shows the outcome once it opens
              sessionStorage.setItem(IMPORT_NOTE_KEY, r.message);
            } catch {}
            router.push(id ? `/admin/import?id=${id}` : '/admin/import');
            router.refresh();
          }}
        >
          <label className="form-field">
            {m('file')}
            <input
              name="file"
              type="file"
              required
              accept=".csv,.xlsx,.xls,.pdf,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,application/pdf"
              onChange={(e) => setPdf(/\.pdf$/i.test(e.currentTarget.files?.[0]?.name ?? ''))}
            />
          </label>
          {pdf &&
            (aiOn ? (
              <>
                <p className="muted">{m('pdfLimit')}</p>
                <label className="flex items-start gap-2">
                  <input type="checkbox" name="aiConsent" required style={{ marginTop: 4 }} />
                  <span>{m('aiConsent')}</span>
                </label>
              </>
            ) : (
              <p className="banner red" role="alert">
                {m('aiOff')}
              </p>
            ))}
          <ActionNotice locale={locale} note={note} />
          <div className="flex flex-wrap justify-end gap-2.5">
            <button type="button" className="btn" data-action="modal.close" disabled={busy} onClick={() => setOpen(false)}>
              {msg(locale, 'staffActions.cancel')}
            </button>
            <button type="submit" className="btn btn-primary" data-action="imp.file.confirm" disabled={busy || (pdf && !aiOn)}>
              <Upload size={16} aria-hidden /> {m('uploadOk')}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}
