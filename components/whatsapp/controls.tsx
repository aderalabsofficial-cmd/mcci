'use client';

import { Send } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useTransition, type ReactNode } from 'react';
import { ActionNotice } from '@/components/shared/action-notice';
import { Modal } from '@/components/shared/modal';
import type { Locale } from '@/i18n/routing';
import { decideCampaign, startCampaign } from '@/lib/whatsapp/actions';
import { callAction, type Outcome } from '@/lib/client/call-action';
import { msg } from '@/lib/nav/model';

/** A button for one server action, with an optional "are you sure" step. The server decides; the answer is shown. */
export function RunAction({
  locale,
  action,
  label,
  dataAction,
  primary = false,
  confirm,
  icon,
}: {
  locale: Locale;
  action: () => Promise<Outcome>;
  label: string;
  dataAction: string;
  primary?: boolean;
  confirm?: string;
  icon?: ReactNode;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState<Outcome | null>(null);
  const [pending, start] = useTransition();
  const busy = msg(locale, 'wa.common.working');
  const run = () =>
    start(async () => {
      const r = await callAction(locale, action);
      setNote(r);
      setOpen(false);
      if (r.ok) router.refresh();
    });
  return (
    <span className="wa-act">
      <button
        type="button"
        className={`btn ${primary ? 'btn-primary' : 'btn-w'}`}
        data-action={dataAction}
        disabled={pending}
        title={pending ? busy : undefined}
        onClick={() => (confirm ? setOpen(true) : run())}
      >
        {icon} {label}
      </button>
      {confirm && (
        <Modal
          open={open}
          onOpenChange={setOpen}
          title={label}
          intro={confirm}
          closeLabel={msg(locale, 'common.close')}
          footer={
            <button
              type="button"
              className="btn btn-primary"
              data-action={`${dataAction}.confirm`}
              disabled={pending}
              title={pending ? busy : undefined}
              onClick={run}
            >
              {label}
            </button>
          }
        >
          <span />
        </Modal>
      )}
      <ActionNotice locale={locale} note={note} />
    </span>
  );
}

/** The explicit launch: shows the exact audience and message, and sends the count back to be checked by the server. */
export function StartCampaign({
  locale,
  id,
  count,
  preview,
}: {
  locale: Locale;
  id: string;
  count: number;
  preview: string;
}) {
  const m = (k: string, v?: Record<string, string>) => msg(locale, `wa.campaign.${k}`, v);
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [at, setAt] = useState('');
  const [note, setNote] = useState<Outcome | null>(null);
  const [pending, start] = useTransition();
  return (
    <span className="wa-act">
      <button type="button" className="btn btn-primary" data-action="wa.campaign.start" onClick={() => setOpen(true)}>
        <Send size={15} aria-hidden /> {m('start')}
      </button>
      <Modal
        open={open}
        onOpenChange={setOpen}
        title={m('startTitle', { n: String(count) })}
        intro={m('startIntro', { n: String(count) })}
        closeLabel={msg(locale, 'common.close')}
        footer={
          <button
            type="button"
            className="btn btn-primary"
            data-action="wa.campaign.start.confirm"
            disabled={pending}
            title={pending ? msg(locale, 'wa.common.working') : undefined}
            onClick={() =>
              start(async () => {
                const r = await callAction(locale, () =>
                  startCampaign(locale, id, at ? new Date(at).toISOString() : null, count),
                );
                setNote(r);
                if (r.ok) {
                  setOpen(false);
                  router.refresh();
                }
              })
            }
          >
            {at ? m('scheduleConfirm') : m('startConfirm', { n: String(count) })}
          </button>
        }
      >
        <p className="wa-bubble" data-start-preview dir="auto">
          {preview}
        </p>
        <label className="form-field">
          {m('scheduleAt')}
          <input type="datetime-local" value={at} data-field="schedule-at" onChange={(e) => setAt(e.target.value)} />
        </label>
        <ActionNotice locale={locale} note={note} />
      </Modal>
    </span>
  );
}

export function DecideCampaign({ locale, id }: { locale: Locale; id: string }) {
  const m = (k: string) => msg(locale, `wa.campaign.${k}`);
  const router = useRouter();
  const [reason, setReason] = useState('');
  const [note, setNote] = useState<Outcome | null>(null);
  const [pending, start] = useTransition();
  const decide = (approve: boolean) =>
    start(async () => {
      const r = await callAction(locale, () => decideCampaign(locale, id, approve, reason));
      setNote(r);
      if (r.ok) router.refresh();
    });
  const busy = pending ? msg(locale, 'wa.common.working') : undefined;
  return (
    <div className="wa-decide">
      <label className="form-field">
        {m('returnReason')}
        <input value={reason} maxLength={300} data-field="decide-reason" onChange={(e) => setReason(e.target.value)} />
      </label>
      <div className="pb">
        <button
          type="button"
          className="btn btn-primary"
          data-action="wa.campaign.approve"
          disabled={pending}
          title={busy}
          onClick={() => decide(true)}
        >
          {m('approve')}
        </button>
        <button
          type="button"
          className="btn btn-w"
          data-action="wa.campaign.return"
          disabled={pending}
          title={busy}
          onClick={() => decide(false)}
        >
          {m('return')}
        </button>
      </div>
      <ActionNotice locale={locale} note={note} />
    </div>
  );
}
