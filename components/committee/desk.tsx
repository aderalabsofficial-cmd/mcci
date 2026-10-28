'use client';

import { Check, FolderOpen, Hash, MessageSquare, Undo2, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { type ReactNode, useState, useTransition } from 'react';
import { Modal } from '@/components/shared/modal';
import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';
import { addNote, type CommitteeResult, decide } from '@/lib/committee/actions';
import { forwardToCommittee } from '@/lib/review/actions';
import { msg } from '@/lib/nav/model';
import { callAction } from '@/lib/client/call-action';

export interface DeskItem {
  appId: string;
  token: string;
  name: string;
  sub: string;
  photo: string | null;
  memberNo: string | null;
  forwarded: string | null;
  notes: { by: string; at: string; note: string }[];
  demo: boolean;
}

type Kind = 'Approved' | 'Rejected' | 'Returned' | 'note' | 'number';
type Dialog = { kind: Kind; item: DeskItem } | null;

/**
 * The Membership Committee desk (docs/21 point 24): every file the Membership Officer forwarded, at once — no meeting
 * or agenda first. The Convener of the committee the President approved approves, declines or returns a file to the
 * officer; committee members leave a note; the officer types a missing membership number. Each button shows only to
 * the person who may use it, and the database refuses anything not allowed (migration 0430).
 */
export function CommitteeDesk({
  locale,
  items,
  canDecide,
  canNote,
  canNumber,
}: {
  locale: Locale;
  items: DeskItem[];
  /** the Convener of the approved committee */
  canDecide: boolean;
  /** a member (or the Convener) of the approved committee */
  canNote: boolean;
  /** Membership Officer and above (mem ≥ 2) */
  canNumber: boolean;
}) {
  const m = (k: string, v?: Record<string, string>) => msg(locale, `committee.desk.${k}`, v);
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [dialog, setDialog] = useState<Dialog>(null);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<CommitteeResult | null>(null);
  const [inner, setInner] = useState<CommitteeResult | null>(null);

  const run = async () => {
    if (!dialog) return;
    setBusy(true);
    setInner(null);
    const { kind, item } = dialog;
    const r =
      kind === 'note'
        ? await callAction(locale, () => addNote(locale, item.appId, text))
        : kind === 'number'
          ? await callAction(locale, () => forwardToCommittee(locale, item.appId, text))
          : await callAction(locale, () => decide(locale, item.appId, kind, text));
    setBusy(false);
    const res: CommitteeResult = { ok: r.ok, message: r.message ?? '' };
    if (!res.ok) return setInner(res);
    setDialog(null);
    setNote(res);
    startTransition(() => router.refresh());
  };
  const open = (kind: Kind, item: DeskItem) => {
    setText(kind === 'number' ? (item.memberNo ?? '') : '');
    setInner(null);
    setDialog({ kind, item });
  };

  const body = (): ReactNode => {
    if (!dialog) return null;
    if (dialog.kind === 'Approved') {
      return (
        <p>
          {m('approveHelp', { no: dialog.item.memberNo ?? '—' })}
        </p>
      );
    }
    if (dialog.kind === 'number') {
      return (
        <label className="form-field">
          {m('numberLabel')}
          <input
            value={text}
            maxLength={20}
            placeholder={m('numberPh')}
            autoComplete="off"
            onChange={(e) => setText(e.target.value)}
          />
          <small className="muted">{m('numberHelp')}</small>
        </label>
      );
    }
    return (
      <label className="form-field">
        {m(dialog.kind === 'note' ? 'noteLabel' : dialog.kind === 'Returned' ? 'returnLabel' : 'note')}
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
      {!items.length && <p className="em">{m('emptyForwarded')}</p>}
      {items.map((a) => {
        const approveWhy = a.demo ? m('demoNoApprove') : !a.memberNo ? m('noNumberYet') : undefined;
        return (
          <div className="agenda" key={a.appId} data-token={a.token}>
            <div className="ofphoto">
              {/* eslint-disable-next-line @next/next/no-img-element -- signed URL of a private file */}
              {a.photo && <img src={a.photo} alt="" />}
            </div>
            <div>
              <b>
                {a.name || a.token}{' '}
                {a.demo && <span className="bd orange">{m('demoBadge')}</span>}
              </b>
              <small>
                {a.token} · {a.memberNo ? m('numberIs', { no: a.memberNo }) : m('noNumber')}
                {a.forwarded ? ` · ${m('forwardedOn', { date: a.forwarded })}` : ''}
              </small>
              <small>{a.sub}</small>
              {a.notes.map((n, i) => (
                <small key={i}>
                  <MessageSquare size={12} aria-hidden /> {n.by} · {n.at}: {n.note}
                </small>
              ))}
            </div>
            <div className="pb">
              <Link className="btn btn-w" href={`/admin/mreview?t=${a.token}`} data-action="adm.app.open">
                <FolderOpen size={16} aria-hidden /> {m('file')}
              </Link>
              {canNumber && !a.memberNo && (
                <button type="button" className="btn btn-w" data-action="adm.forward" onClick={() => open('number', a)}>
                  <Hash size={16} aria-hidden /> {m('typeNumber')}
                </button>
              )}
              {canNote && (
                <button type="button" className="btn btn-w" data-action="cmt.note" onClick={() => open('note', a)}>
                  <MessageSquare size={16} aria-hidden /> {m('addNote')}
                </button>
              )}
              {canDecide && (
                <>
                  <button
                    type="button"
                    className="btn btn-w"
                    data-action="cmt.decide"
                    data-decision="Returned"
                    onClick={() => open('Returned', a)}
                  >
                    <Undo2 size={16} aria-hidden /> {m('returnToOfficer')}
                  </button>
                  <button
                    type="button"
                    className="btn btn-w btn-danger"
                    data-action="cmt.decide"
                    data-decision="Rejected"
                    onClick={() => open('Rejected', a)}
                  >
                    <X size={16} aria-hidden /> {m('reject')}
                  </button>
                  <button
                    type="button"
                    className="btn btn-w btn-primary"
                    data-action="cmt.decide"
                    data-decision="Approved"
                    disabled={Boolean(approveWhy)}
                    title={approveWhy}
                    onClick={() => open('Approved', a)}
                  >
                    <Check size={16} aria-hidden /> {m('approve')}
                  </button>
                </>
              )}
            </div>
          </div>
        );
      })}
      <Modal
        open={Boolean(dialog)}
        onOpenChange={(o) => !o && setDialog(null)}
        title={dialog ? m(`${dialog.kind}Title`, { name: dialog.item.name || dialog.item.token }) : ''}
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
                data-action={
                  dialog.kind === 'note' ? 'cmt.note.confirm' : dialog.kind === 'number' ? 'adm.forward.confirm' : 'cmt.decide.confirm'
                }
                disabled={busy}
                title={busy ? msg(locale, 'membership.wiz.working') : undefined}
                onClick={() => void run()}
              >
                {busy ? msg(locale, 'membership.wiz.working') : m(`${dialog.kind}Ok`)}
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
