'use client';

import { Check, UserCog, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { Modal } from '@/components/shared/modal';
import type { Locale } from '@/i18n/routing';
import { type CommitteeResult, decideCommittee, proposeCommittee } from '@/lib/committee/actions';
import type { Assignment, CommitteePerson } from '@/lib/committee/load';
import { msg } from '@/lib/nav/model';
import { callAction } from '@/lib/client/call-action';

/**
 * Who sits on the Membership Committee (docs/21 §1): the Secretary General proposes the Convener and members from the
 * staff accounts; it counts only once the President approves. Shown to everyone on the desk; the buttons only to the
 * SG (assign) and the President (approve / not approve). The database checks the designation again (migration 0430).
 */
export function CommitteeAssignment({
  locale,
  current,
  pending,
  staff,
  canPropose,
  canApprove,
}: {
  locale: Locale;
  current: Assignment | null;
  pending: Assignment | null;
  /** active staff the SG may choose from (empty for everyone else) */
  staff: CommitteePerson[];
  canPropose: boolean;
  canApprove: boolean;
}) {
  const m = (k: string, v?: Record<string, string>) => msg(locale, `committee.assign.${k}`, v);
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [dialog, setDialog] = useState<'propose' | 'reject' | null>(null);
  const [convener, setConvener] = useState('');
  const [members, setMembers] = useState<string[]>([]);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<CommitteeResult | null>(null);
  const [inner, setInner] = useState<CommitteeResult | null>(null);

  const done = (r: { ok: boolean; message?: string }) => {
    const res = { ok: r.ok, message: r.message ?? '' };
    if (!res.ok) return setInner(res);
    setDialog(null);
    setNote(res);
    startTransition(() => router.refresh());
  };
  const people = (a: Assignment) =>
    a.members.length ? a.members.map((x) => x.name).join(', ') : m('noMembers');
  const approve = async () => {
    if (!pending) return;
    setBusy(true);
    const r = await callAction(locale, () => decideCommittee(locale, pending.id, true, ''));
    setBusy(false);
    if (!r.ok) return setNote({ ok: false, message: r.message ?? '' });
    done(r);
  };

  return (
    <div className="card" style={{ marginBottom: 18 }} data-testid="committee-assignment">
      <div className="ch">
        <h3>{m('title')}</h3>
        {canPropose && (
          <button
            type="button"
            className="btn btn-w"
            data-action="cmt.assign"
            onClick={() => {
              setConvener(current?.convener.id ?? '');
              setMembers(current?.members.map((x) => x.id) ?? []);
              setText('');
              setInner(null);
              setDialog('propose');
            }}
          >
            <UserCog size={16} aria-hidden /> {m(current ? 'change' : 'assign')}
          </button>
        )}
      </div>
      {note && (
        <div className={`banner ${note.ok ? 'green' : 'red'}`} role={note.ok ? 'status' : 'alert'} style={{ marginBottom: 12 }}>
          <span>{note.message}</span>
        </div>
      )}
      {current ? (
        <div className="kv">
          <div>
            <small>{m('convener')}</small>
            <b>{current.convener.name}</b>
          </div>
          <div>
            <small>{m('members')}</small>
            <b>{people(current)}</b>
          </div>
          <div>
            <small>{m('approvedBy')}</small>
            <b>
              {current.decidedBy ?? '—'}
              {current.decidedAt ? ` · ${current.decidedAt}` : ''}
            </b>
          </div>
        </div>
      ) : (
        <p className="em">{m('none')}</p>
      )}
      {pending && (
        <div className="banner orange" role="status" style={{ marginTop: 12, flexWrap: 'wrap', gap: 10 }} data-testid="committee-pending">
          <span style={{ flex: 1 }}>
            {m('pending', { convener: pending.convener.name, members: people(pending), by: pending.proposedBy ?? '—' })}
            {pending.note ? ` — ${pending.note}` : ''}
          </span>
          {canApprove && (
            <span className="pb">
              <button
                type="button"
                className="btn btn-w btn-danger"
                data-action="cmt.assign.decide"
                data-decision="no"
                onClick={() => {
                  setText('');
                  setInner(null);
                  setDialog('reject');
                }}
              >
                <X size={16} aria-hidden /> {m('notApprove')}
              </button>
              <button
                type="button"
                className="btn btn-w btn-primary"
                data-action="cmt.assign.decide"
                data-decision="yes"
                disabled={busy}
                onClick={() => void approve()}
              >
                <Check size={16} aria-hidden /> {busy ? msg(locale, 'membership.wiz.working') : m('approve')}
              </button>
            </span>
          )}
        </div>
      )}

      <Modal
        open={dialog !== null}
        onOpenChange={(o) => !o && setDialog(null)}
        title={dialog === 'reject' ? m('rejectTitle') : m('proposeTitle')}
        intro={dialog === 'reject' ? undefined : m('proposeHelp')}
        closeLabel={msg(locale, 'common.close')}
        footer={
          <>
            <button type="button" className="btn" data-action="modal.close" onClick={() => setDialog(null)}>
              {msg(locale, 'committee.desk.cancel')}
            </button>
            <button
              type="button"
              className={`btn ${dialog === 'reject' ? 'btn-danger' : 'btn-primary'}`}
              data-action={dialog === 'reject' ? 'cmt.assign.decide.confirm' : 'cmt.assign.confirm'}
              disabled={busy || (dialog === 'propose' && !convener)}
              onClick={async () => {
                setBusy(true);
                const r =
                  dialog === 'reject'
                    ? await callAction(locale, () => decideCommittee(locale, pending?.id ?? '', false, text))
                    : await callAction(locale, () => proposeCommittee(locale, convener, members, text));
                setBusy(false);
                done(r);
              }}
            >
              {busy ? msg(locale, 'membership.wiz.working') : m(dialog === 'reject' ? 'notApprove' : 'send')}
            </button>
          </>
        }
      >
        {dialog === 'propose' ? (
          <>
            <label className="form-field">
              {m('convener')}
              <select value={convener} onChange={(e) => setConvener(e.target.value)} required>
                <option value="">{m('pick')}</option>
                {staff.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} · {s.designation}
                  </option>
                ))}
              </select>
            </label>
            <fieldset className="form-field">
              <legend>{m('members')}</legend>
              {staff
                .filter((s) => s.id !== convener)
                .map((s) => (
                  <label key={s.id} className="flex min-h-11 items-center gap-2.5">
                    <input
                      type="checkbox"
                      className="size-5 shrink-0"
                      checked={members.includes(s.id)}
                      onChange={(e) =>
                        setMembers((x) => (e.target.checked ? [...x, s.id] : x.filter((y) => y !== s.id)))
                      }
                    />
                    {s.name} · {s.designation}
                  </label>
                ))}
            </fieldset>
            <label className="form-field">
              {m('noteOpt')}
              <textarea rows={2} maxLength={1000} value={text} onChange={(e) => setText(e.target.value)} />
            </label>
          </>
        ) : (
          <label className="form-field">
            {m('reason')}
            <textarea rows={3} maxLength={1000} value={text} onChange={(e) => setText(e.target.value)} required />
          </label>
        )}
        {inner && !inner.ok && (
          <p role="alert" style={{ color: '#b91c1c', fontWeight: 700 }}>
            {inner.message}
          </p>
        )}
      </Modal>
    </div>
  );
}
