'use client';

import { Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { ActionNotice } from '@/components/shared/action-notice';
import { Modal } from '@/components/shared/modal';
import type { Locale } from '@/i18n/routing';
import { deleteSegment } from '@/lib/business/actions';
import { callAction, type Outcome } from '@/lib/client/call-action';
import { msg } from '@/lib/nav/model';

export function DeleteSegment({ locale, id, name }: { locale: Locale; id: string; name: string }) {
  const m = (k: string, v?: Record<string, string>) => msg(locale, `biz.segments.${k}`, v);
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState<Outcome | null>(null);
  const [pending, start] = useTransition();
  return (
    <>
      <button type="button" className="btn btn-w" data-action="biz.segment.delete" onClick={() => setOpen(true)}>
        <Trash2 size={15} aria-hidden /> {m('delete')}
      </button>
      <Modal
        open={open}
        onOpenChange={setOpen}
        title={m('deleteTitle', { name })}
        intro={m('deleteIntro')}
        closeLabel={msg(locale, 'common.close')}
        footer={
          <button
            type="button"
            className="btn btn-primary"
            data-action="biz.segment.delete.confirm"
            disabled={pending}
            title={pending ? msg(locale, 'biz.profile.working') : undefined}
            onClick={() =>
              start(async () => {
                const r = await callAction(locale, () => deleteSegment(locale, id));
                setNote(r);
                if (r.ok) {
                  setOpen(false);
                  router.refresh();
                }
              })
            }
          >
            {m('deleteConfirm')}
          </button>
        }
      >
        <ActionNotice locale={locale} note={note} />
      </Modal>
    </>
  );
}
