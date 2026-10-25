'use client';

import { Check, Lock, RefreshCw, Signature, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useRef, useState, useTransition } from 'react';
import { Modal } from '@/components/shared/modal';
import type { Locale } from '@/i18n/routing';
import { declineEndorsement, sendSignCode, signEndorsement } from '@/lib/endorse/actions';
import { msg } from '@/lib/nav/model';
import { callAction } from '@/lib/client/call-action';

/**
 * Endorsement requests for a member (prototype member/endorse): waiting requests and history; Review (applicant summary,
 * never documents or CNIC), Approve & sign (declaration + drawn signature + 6-digit code emailed to the signer),
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

type Dialog = { kind: 'review' | 'sign' | 'decline'; row: InboxRow } | null;

export function EndorseInbox({
  locale,
  rows,
  me,
  needCode,
}: {
  locale: Locale;
  rows: InboxRow[];
  me: string;
  needCode: boolean;
}) {
  const m = (k: string, v?: Record<string, string>) => msg(locale, `endorse.${k}`, v);
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [dialog, setDialog] = useState<Dialog>(null);
  const [note, setNote] = useState<{ ok: boolean; message: string } | null>(null);
  const [inner, setInner] = useState<{ ok: boolean; message: string } | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [accepted, setAccepted] = useState(true);
  const [code, setCode] = useState('');
  const [reason, setReason] = useState('');
  const [extra, setExtra] = useState('');
  const canvas = useRef<HTMLCanvasElement | null>(null);
  const last = useRef<[number, number] | null>(null);
  const [drawn, setDrawn] = useState(false);
  const date = (iso: string) =>
    new Date(iso).toLocaleDateString(locale === 'ur' ? 'ur-PK' : 'en-GB', {
      timeZone: 'Asia/Karachi',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });

  const pending = rows.filter((r) => r.status === 'Pending');
  const past = rows.filter((r) => r.status !== 'Pending');
  const open = (kind: 'review' | 'sign' | 'decline', row: InboxRow) => {
    setInner(null);
    setCode('');
    setAccepted(true);
    setDrawn(false);
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
  const point = (e: React.PointerEvent<HTMLCanvasElement>): [number, number] => {
    const r = e.currentTarget.getBoundingClientRect();
    return [((e.clientX - r.left) * 560) / r.width, ((e.clientY - r.top) * 170) / r.height];
  };

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
            <button type="button" className="btn btn-gold btn-w" data-action="end.sign" onClick={() => open('sign', r)}>
              <Signature size={16} aria-hidden /> {m('inbox.sign')}
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
              <button type="button" className="btn btn-gold" data-action="end.sign" onClick={() => open('sign', d.row)}>
                <Signature size={16} aria-hidden /> {m('inbox.sign')}
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
        open={d?.kind === 'sign'}
        onOpenChange={(o) => !o && setDialog(null)}
        wide
        title={m('inbox.sign')}
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
                data-action="end.sign.confirm"
                disabled={busy === 'sign'}
                onClick={async () => {
                  if (!accepted) return setInner({ ok: false, message: m('errors.declaration') });
                  if (!drawn || !canvas.current) return setInner({ ok: false, message: m('errors.signature') });
                  if (needCode && !/^\d{6}$/.test(code)) return setInner({ ok: false, message: m('errors.code') });
                  setBusy('sign');
                  const blob: Blob | null = await new Promise((res) => canvas.current!.toBlob(res, 'image/png'));
                  const fd = new FormData();
                  fd.set('locale', locale);
                  fd.set('id', d.row.id);
                  fd.set('code', code);
                  fd.set('declaration', declaration(d.row));
                  if (blob) fd.set('signature', new File([blob], 'signature.png', { type: 'image/png' }));
                  const r = await callAction(locale, () => signEndorsement(fd));
                  setBusy(null);
                  if (!r.ok) return setInner(r);
                  setDialog(null);
                  setNote(r);
                  startTransition(() => router.refresh());
                }}
              >
                <Signature size={16} aria-hidden />{' '}
                {busy === 'sign' ? msg(locale, 'membership.wiz.working') : m('inbox.signApprove')}
              </button>
            </>
          ) : undefined
        }
      >
        {d && (
          <div className="proto">
            <button
              type="button"
              className={`decl ${accepted ? 'on' : ''}`}
              aria-pressed={accepted}
              data-action="end.decl"
              onClick={() => setAccepted((a) => !a)}
            >
              <i>{accepted ? '✓' : ''}</i>
              <span>{declaration(d.row)}</span>
            </button>
            <h4 className="jg">{m('inbox.yourSignature')}</h4>
            <canvas
              ref={(el) => {
                canvas.current = el;
                if (el) {
                  const x = el.getContext('2d')!;
                  x.lineWidth = 2.6;
                  x.lineCap = 'round';
                  x.lineJoin = 'round';
                  x.strokeStyle = '#0b2a8a';
                }
              }}
              className="sigpad"
              width={560}
              height={170}
              aria-label={m('inbox.yourSignature')}
              style={{ touchAction: 'none', width: '100%' }}
              onPointerDown={(e) => {
                last.current = point(e);
                e.currentTarget.setPointerCapture(e.pointerId);
              }}
              onPointerMove={(e) => {
                if (!last.current) return;
                const p = point(e);
                const x = e.currentTarget.getContext('2d')!;
                x.beginPath();
                x.moveTo(...last.current);
                x.lineTo(...p);
                x.stroke();
                last.current = p;
                if (!drawn) setDrawn(true);
              }}
              onPointerUp={() => {
                last.current = null;
              }}
            />
            <div className="pb" style={{ marginTop: 8 }}>
              <button
                type="button"
                className="btn btn-w"
                data-action="end.clear"
                onClick={() => {
                  canvas.current?.getContext('2d')?.clearRect(0, 0, 560, 170);
                  setDrawn(false);
                }}
              >
                <RefreshCw size={16} aria-hidden /> {m('inbox.clear')}
              </button>
            </div>
            {needCode && (
              <div className="fg" style={{ marginTop: 14 }}>
                <label className="jf">
                  {m('inbox.code')} <em className="rq">*</em>
                  <input
                    inputMode="numeric"
                    maxLength={6}
                    autoComplete="one-time-code"
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                  />
                </label>
                <div style={{ alignSelf: 'end' }}>
                  <button
                    type="button"
                    className="btn"
                    data-action="end.code"
                    disabled={busy === 'code'}
                    onClick={async () => {
                      setBusy('code');
                      setInner(await callAction(locale, () => sendSignCode(locale, d.row.id)));
                      setBusy(null);
                    }}
                  >
                    {busy === 'code' ? msg(locale, 'membership.wiz.working') : m('inbox.sendCode')}
                  </button>
                </div>
              </div>
            )}
            {inner && (
              <p
                role={inner.ok ? 'status' : 'alert'}
                style={{ marginTop: 10, fontWeight: 700, color: inner.ok ? '#0f5b3c' : '#b91c1c' }}
              >
                {inner.ok ? <Check size={16} aria-hidden /> : <X size={16} aria-hidden />} {inner.message}
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
