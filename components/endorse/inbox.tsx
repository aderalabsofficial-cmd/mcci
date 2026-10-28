'use client';

import { Check, Lock, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { Modal } from '@/components/shared/modal';
import type { Locale } from '@/i18n/routing';
import { approveEndorsement, declineEndorsement } from '@/lib/endorse/actions';
import { msg } from '@/lib/nav/model';
import { callAction } from '@/lib/client/call-action';

/**
 * Endorsement requests for a member (prototype member/endorse): waiting requests and history; Review (applicant summary,
 * never documents or CNIC), Approve (consent only — owner's decision, docs/21 point 17: no code, no signature) and
 * Decline (reason). The server checks again that the request is the person's own.
 */

export interface InboxRow {
  id: string;
  role: 'proposer' | 'seconder';
  status: string;
  member_no: string;
  my_company: string;
  message: string | null;
  requested_at: string;
  expires_at: string;
  token: string;
  applicant: string;
  business: string;
  bizLabel: string;
  nature: string;
  address: string;
  est: string;
  cls: string;
  partners: string[];
}

type Dialog = { kind: 'review' | 'approve' | 'decline'; row: InboxRow } | null;

export function EndorseInbox({ locale, rows, me }: { locale: Locale; rows: InboxRow[]; me: string }) {
  const m = (k: string, v?: Record<string, string>) => msg(locale, `endorse.${k}`, v);
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [dialog, setDialog] = useState<Dialog>(null);
  const [note, setNote] = useState<{ ok: boolean; message: string } | null>(null);
  const [inner, setInner] = useState<{ ok: boolean; message: string } | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [reason, setReason] = useState('');
  const [extra, setExtra] = useState('');
  const date = (iso: string) =>
    new Date(iso).toLocaleDateString(locale === 'ur' ? 'ur-PK' : 'en-GB', {
      timeZone: 'Asia/Karachi',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });

  const pending = rows.filter((r) => r.status === 'Pending');
  const past = rows.filter((r) => r.status !== 'Pending');
  const open = (kind: 'review' | 'approve' | 'decline', row: InboxRow) => {
    setInner(null);
    setReason(msg(locale, 'endorse.inbox.reasons.know'));
    setExtra('');
    setDialog({ kind, row });
  };
  const declaration = (row: InboxRow) =>
    m('inbox.declaration', {
      me,
      no: row.member_no,
      applicant: row.applicant,
      business: row.business,
      verb: m(row.role === 'proposer' ? 'inbox.verbProposer' : 'inbox.verbSeconder'),
    });

  const card = (r: InboxRow) => {
    const daysLeft = Math.max(0, Math.ceil((new Date(r.expires_at).getTime() - Date.now()) / 86_400_000));
    return (
      <div className={`ereq ${r.status === 'Pending' ? 'new' : ''}`} key={r.id} data-request={r.token}>
        <div className="eav">
          {r.applicant
            .split(/\s+/)
            .map((w) => w[0])
            .slice(0, 2)
            .join('')}
        </div>
        <div className="ebx">
          <b>{r.business || '—'}</b>
          <small>
            {r.applicant} · {r.bizLabel} · {m('inbox.applyingAs', { cls: r.cls })}
          </small>
          <small>
            {m('inbox.asked', { role: m(`roles.${r.role}`), date: date(r.requested_at) })}
            {r.status === 'Pending' ? ` · ${m('inbox.daysLeft', { n: String(daysLeft) })}` : ''}
          </small>
        </div>
        {r.status === 'Pending' ? (
          <>
            <button type="button" className="btn btn-w" data-action="end.review" onClick={() => open('review', r)}>
              {m('inbox.review')}
            </button>
            <button type="button" className="btn btn-gold btn-w" data-action="end.approve" onClick={() => open('approve', r)}>
              <Check size={16} aria-hidden /> {m('inbox.approve')}
            </button>
          </>
        ) : (
          <>
            <span className={`bd ${r.status === 'Approved' ? 'green' : 'red'}`}>{m(`slots.status.${r.status}`)}</span>
            <button type="button" className="btn btn-w" data-action="end.review" onClick={() => open('review', r)}>
              {m('inbox.view')}
            </button>
          </>
        )}
      </div>
    );
  };

  const d = dialog;
  return (
    <>
      {note && (
        <div
          className={`banner ${note.ok ? 'green' : 'red'}`}
          role={note.ok ? 'status' : 'alert'}
          style={{ marginBottom: 14 }}
        >
          <span>{note.message}</span>
        </div>
      )}
      <div className="card" style={{ marginBottom: 18 }}>
        <div className="ch">
          <h3>{m('inbox.waiting')}</h3>
        </div>
        {pending.length ? pending.map(card) : <p className="muted">{m('inbox.waitingNone')}</p>}
      </div>
      <div className="card">
        <div className="ch">
          <h3>{m('inbox.history')}</h3>
        </div>
        {past.length ? past.map(card) : <p className="muted">{m('inbox.historyNone')}</p>}
      </div>

      <Modal
        open={d?.kind === 'review'}
        onOpenChange={(o) => !o && setDialog(null)}
        wide
        title={d ? m('inbox.reviewTitle', { role: m(`roles.${d.row.role}`), business: d.row.business }) : ''}
        closeLabel={msg(locale, 'common.close')}
        footer={
          d && d.row.status === 'Pending' ? (
            <>
              <button
                type="button"
                className="btn btn-danger"
                data-action="end.decline"
                onClick={() => open('decline', d.row)}
              >
                {m('inbox.decline')}
              </button>
              <button type="button" className="btn btn-gold" data-action="end.approve" onClick={() => open('approve', d.row)}>
                <Check size={16} aria-hidden /> {m('inbox.approve')}
              </button>
            </>
          ) : undefined
        }
      >
        {d && (
          <div className="proto">
            {d.row.message && (
              <div className="m1" style={{ marginBottom: 12 }}>
                <b>{m('inbox.wrote', { name: d.row.applicant })}</b>
                <br />
                {d.row.message}
              </div>
            )}
            <div className="kv">
              {(
                [
                  ['applicant', d.row.applicant],
                  ['business', d.row.business],
                  ['type', d.row.bizLabel],
                  ['nature', d.row.nature],
                  ['address', d.row.address],
                  ['est', d.row.est],
                  ['cls', d.row.cls],
                  ['youAre', m(`roles.${d.row.role}`)],
                ] as const
              ).map(([k, v]) => (
                <div key={k}>
                  <small>{k === 'business' ? m('picker.business') : m(`inbox.${k}`)}</small>
                  <b>{v || '—'}</b>
                </div>
              ))}
              {d.row.partners.length > 0 && (
                <div>
                  <small>{m('inbox.partners')}</small>
                  <b>{d.row.partners.join(', ')}</b>
                </div>
              )}
            </div>
            <p className="muted" style={{ marginTop: 12 }}>
              <Lock size={14} color="#94a3b8" aria-hidden /> {m('inbox.private')}
            </p>
          </div>
        )}
      </Modal>

      <Modal
        open={d?.kind === 'approve'}
        onOpenChange={(o) => !o && setDialog(null)}
        title={d ? m('inbox.approveTitle', { role: m(`roles.${d.row.role}`), business: d.row.business }) : ''}
        closeLabel={msg(locale, 'common.close')}
        footer={
          d ? (
            <>
              <button type="button" className="btn" data-action="modal.close" onClick={() => setDialog(null)}>
                {m('inbox.cancel')}
              </button>
              <button
                type="button"
                className="btn btn-gold"
                data-action="end.approve.confirm"
                disabled={busy === 'approve'}
                onClick={async () => {
                  setBusy('approve');
                  const r = await callAction(locale, () => approveEndorsement(locale, d.row.id));
                  setBusy(null);
                  if (!r.ok) return setInner(r);
                  setDialog(null);
                  setNote(r);
                  startTransition(() => router.refresh());
                }}
              >
                <Check size={16} aria-hidden />{' '}
                {busy === 'approve' ? msg(locale, 'membership.wiz.working') : m('inbox.approve')}
              </button>
            </>
          ) : undefined
        }
      >
        {d && (
          <div className="proto">
            <p>{declaration(d.row)}</p>
            <p className="muted">{m('inbox.approveHelp')}</p>
            {inner && !inner.ok && (
              <p role="alert" style={{ marginTop: 10, fontWeight: 700, color: '#b91c1c' }}>
                <X size={16} aria-hidden /> {inner.message}
              </p>
            )}
          </div>
        )}
      </Modal>

      <Modal
        open={d?.kind === 'decline'}
        onOpenChange={(o) => !o && setDialog(null)}
        title={m('inbox.declineTitle')}
        intro={m('inbox.declineIntro')}
        closeLabel={msg(locale, 'common.close')}
        footer={
          d ? (
            <>
              <button type="button" className="btn" data-action="modal.close" onClick={() => setDialog(null)}>
                {m('inbox.cancel')}
              </button>
              <button
                type="button"
                className="btn btn-danger"
                data-action="end.decline.confirm"
                disabled={busy === 'decline'}
                onClick={async () => {
                  setBusy('decline');
                  const r = await callAction(locale, () =>
                    declineEndorsement(locale, d.row.id, `${reason}${extra.trim() ? ` — ${extra.trim()}` : ''}`),
                  );
                  setBusy(null);
                  if (!r.ok) return setInner(r);
                  setDialog(null);
                  setNote(r);
                  startTransition(() => router.refresh());
                }}
              >
                {m('inbox.decline')}
              </button>
            </>
          ) : undefined
        }
      >
        <label className="form-field">
          {m('inbox.reason')}
          <select value={reason} onChange={(e) => setReason(e.target.value)}>
            {(['know', 'sector', 'busy', 'other'] as const).map((k) => (
              <option key={k} value={msg(locale, `endorse.inbox.reasons.${k}`)}>
                {msg(locale, `endorse.inbox.reasons.${k}`)}
              </option>
            ))}
          </select>
        </label>
        <label className="form-field">
          {m('inbox.noteOpt')}
          <textarea rows={3} maxLength={300} value={extra} onChange={(e) => setExtra(e.target.value)} />
        </label>
        {inner && !inner.ok && (
          <p role="alert" style={{ color: '#b91c1c', fontWeight: 700 }}>
            {inner.message}
          </p>
        )}
      </Modal>
    </>
  );
}
