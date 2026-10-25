'use client';

import { Check, Clock, FolderOpen, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { type ReactNode, useState, useTransition } from 'react';
import { Modal } from '@/components/shared/modal';
import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';
import { approveAll, type CommitteeResult, decide } from '@/lib/committee/actions';
import { msg } from '@/lib/nav/model';
import { callAction } from '@/lib/client/call-action';

export interface DeskItem {
  appId: string;
  token: string;
  item: number | null;
  name: string;
  sub: string;
  photo: string | null;
  deferred: string | null;
}

type Dialog =
  | { kind: 'Approved' | 'Deferred' | 'Rejected'; item: DeskItem }
  | { kind: 'all' }
  | null;

/**
 * The agenda of one Membership Committee meeting (prototype admin/committee): each file with File, Defer, Reject,
 * Approve (cmt.decide) and "Approve all on agenda" (cmt.approveAll). Approve and approve-all ask once more because
 * they allocate membership numbers and email vouchers. The database refuses anything not allowed.
 */
export function CommitteeAgenda({
  locale,
  meeting,
  items,
  canDecide,
  heldYet,
  approveAllSlot,
  empty,
}: {
  locale: Locale;
  meeting: string;
  items: DeskItem[];
  canDecide: boolean;
  heldYet: boolean;
  approveAllSlot: 'header' | 'none';
  /** shown when no file is open on this agenda */
  empty?: string;
}) {
  const m = (k: string, v?: Record<string, string>) => msg(locale, `committee.desk.${k}`, v);
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [dialog, setDialog] = useState<Dialog>(null);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<CommitteeResult | null>(null);
  const [inner, setInner] = useState<CommitteeResult | null>(null);
  const active = canDecide && heldYet;

  const run = async () => {
    if (!dialog) return;
    setBusy(true);
    setInner(null);
    const r =
      dialog.kind === 'all'
        ? await callAction(locale, () => approveAll(locale, meeting))
        : await callAction(locale, () => decide(locale, dialog.item.appId, meeting, dialog.kind, text));
    setBusy(false);
    if (!r.ok) return setInner(r);
    setDialog(null);
    setNote(r);
    startTransition(() => router.refresh());
  };
  const open = (d: Dialog) => {
    setText('');
    setInner(null);
    setDialog(d);
  };

  const title = (): string => {
    if (!dialog) return '';
    if (dialog.kind === 'all') return m('approveAllTitle', { n: String(items.length) });
    return m(`${dialog.kind}Title`, { name: dialog.item.name || dialog.item.token });
  };
  const body = (): ReactNode => {
    if (!dialog) return null;
    if (dialog.kind === 'all' || dialog.kind === 'Approved') return <p>{m('approveHelp')}</p>;
    return (
      <label className="form-field">
        {m('note')}
        <textarea value={text} rows={4} maxLength={2000} required onChange={(e) => setText(e.target.value)} />
      </label>
    );
  };

  return (
    <>
      {note && (
        <div className={`banner ${note.ok ? 'green' : 'red'}`} role={note.ok ? 'status' : 'alert'} style={{ marginBottom: 12 }}>
          <span>{note.message}</span>
        </div>
      )}
      {approveAllSlot === 'header' && canDecide && items.length > 0 && (
        <div className="pb" style={{ marginBottom: 12 }}>
          <button
            type="button"
            className="btn btn-primary"
            data-action="cmt.approveAll"
            disabled={!heldYet}
            title={heldYet ? undefined : m('notHeld')}
            onClick={() => open({ kind: 'all' })}
          >
            <Check size={16} aria-hidden /> {m('approveAll')}
          </button>
        </div>
      )}
      {canDecide && !heldYet && items.length > 0 && <p className="muted">{m('notHeld')}</p>}
      {!items.length && empty && <p className="em">{empty}</p>}
      {items.map((a) => (
        <div className="agenda" key={a.appId} data-token={a.token}>
          <div className="ofphoto">
            {/* eslint-disable-next-line @next/next/no-img-element -- signed URL of a private file */}
            {a.photo && <img src={a.photo} alt="" />}
          </div>
          <div>
            <b>
              {a.item ? `${a.item}. ` : ''}
              {a.name || a.token}
            </b>
            <small>{a.sub}</small>
            {a.deferred && (
              <small>
                <span className="bd orange">
                  <Clock size={12} aria-hidden /> {m('deferredBadge')}
                </span>{' '}
                {a.deferred}
              </small>
            )}
          </div>
          <div className="pb">
            <Link className="btn btn-w" href={`/admin/mreview?t=${a.token}`} data-action="adm.app.open">
              <FolderOpen size={16} aria-hidden /> {m('file')}
            </Link>
            {canDecide && (
              <>
                <button
                  type="button"
                  className="btn btn-w"
                  data-action="cmt.decide"
                  data-decision="Deferred"
                  disabled={!active}
                  title={active ? undefined : m('notHeld')}
                  onClick={() => open({ kind: 'Deferred', item: a })}
                >
                  <Clock size={16} aria-hidden /> {m('defer')}
                </button>
                <button
                  type="button"
                  className="btn btn-w btn-danger"
                  data-action="cmt.decide"
                  data-decision="Rejected"
                  disabled={!active}
                  title={active ? undefined : m('notHeld')}
                  onClick={() => open({ kind: 'Rejected', item: a })}
                >
                  <X size={16} aria-hidden /> {m('reject')}
                </button>
                <button
                  type="button"
                  className="btn btn-w btn-primary"
                  data-action="cmt.decide"
                  data-decision="Approved"
                  disabled={!active}
                  title={active ? undefined : m('notHeld')}
                  onClick={() => open({ kind: 'Approved', item: a })}
                >
                  <Check size={16} aria-hidden /> {m('approve')}
                </button>
              </>
            )}
          </div>
        </div>
      ))}
      <Modal
        open={Boolean(dialog)}
        onOpenChange={(o) => !o && setDialog(null)}
        title={title()}
        closeLabel={msg(locale, 'common.close')}
        footer={
          dialog && (
            <>
              <button type="button" className="btn" data-action="modal.close" onClick={() => setDialog(null)}>
                {m('cancel')}
              </button>
              <button
                type="button"
                className={`btn ${dialog.kind === 'Rejected' ? 'btn-danger' : 'btn-primary'}`}
                data-action={dialog.kind === 'all' ? 'cmt.approveAll.confirm' : 'cmt.decide.confirm'}
                disabled={busy}
                title={busy ? msg(locale, 'membership.wiz.working') : undefined}
                onClick={() => void run()}
              >
                {busy ? msg(locale, 'membership.wiz.working') : m(dialog.kind === 'all' ? 'approveAll' : `${dialog.kind}Ok`)}
              </button>
            </>
          )
        }
      >
        {body()}
        {inner && !inner.ok && (
          <p role="alert" style={{ color: '#b91c1c', fontWeight: 700 }}>
            {inner.message}
          </p>
        )}
      </Modal>
    </>
  );
}
