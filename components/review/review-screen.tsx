'use client';

import { Check, Clock, Pencil, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { type ReactNode, useEffect, useState, useTransition } from 'react';
import { Ic } from '@/components/membership/ui';
import { ActionNotice } from '@/components/shared/action-notice';
import { Modal } from '@/components/shared/modal';
import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';
import { callAction, type Outcome } from '@/lib/client/call-action';
import type { FormField } from '@/lib/membership/reference';
import { msg } from '@/lib/nav/model';
import {
  correctField,
  rejectApplication,
  returnApplication,
  reviewDocument,
  type ReviewResult,
  setCheck,
  setClass,
  startReview,
  verifyApplication,
} from '@/lib/review/actions';

/**
 * Application Review (prototype admin/mreview): one application as on the official form — particulars (correctable
 * with a reason), documents per business type (view / accept / reject with reason), partners, officer checklist,
 * history and the emails sent; start review / return / verify / reject. Every button calls a server action that the
 * database checks again; what a person may do comes from their level in module 'mem' (docs/06).
 */

export interface ReviewDoc {
  id: string;
  key: string;
  short: string;
  label: string;
  required: boolean;
  file: string | null;
  status: 'pending' | 'ok' | 'rejected' | null;
  reason: string | null;
  url: string | null;
  reuploaded: boolean;
}

export interface ReviewData {
  id: string;
  token: string;
  stage: string;
  stageLabel: string;
  stageTone: string;
  name: string;
  bizLabel: string;
  particulars: { key: FormField; label: string; value: string; check: boolean }[];
  docs: ReviewDoc[];
  partners: { name: string; cnic: string | null; mobile: string | null; card: boolean }[];
  checks: { key: string; label: string; on: boolean }[];
  history: { title: string; sub: string }[];
  emails: { label: string; status: string; statusLabel: string; at: string }[];
  kpis: { time: string; timeSub: string; docs: string; cls: string; clsSub: string; fee: string };
  cls: 'Corporate' | 'Associate';
  photoUrl: string | null;
}

type Dialog =
  | { kind: 'return' }
  | { kind: 'reject' }
  | { kind: 'verify' }
  | { kind: 'class' }
  | { kind: 'doc'; doc: ReviewDoc }
  | { kind: 'edit'; field: ReviewData['particulars'][number] }
  | null;

export function ReviewScreen({
  locale,
  data,
  level,
  form,
  endorse,
  committee,
}: {
  locale: Locale;
  data: ReviewData;
  level: number;
  form: ReactNode;
  /** proposer & seconder card body (components/endorse/admin-card.tsx) */
  endorse: ReactNode;
  /** the Membership Committee record (components/committee/admin-card.tsx), for staff who may see it */
  committee?: ReactNode;
}) {
  const m = (k: string, v?: Record<string, string>) => msg(locale, `review.desk.${k}`, v);
  const router = useRouter();
  const [refreshing, startTransition] = useTransition();
  const [busy, setBusy] = useState<string | null>(null);
  const [note, setNote] = useState<Outcome | null>(null);
  const [dialog, setDialog] = useState<Dialog>(null);
  const [text, setText] = useState('');
  const [value, setValue] = useState('');
  const [clsValue, setClsValue] = useState<'Corporate' | 'Associate'>(data.cls);
  const [showForm, setShowForm] = useState(false);

  const inReview = data.stage === 'review';
  const canWork = level >= 2;
  const canDecide = level >= 3;
  // Decisions the server confirmed, shown at once — the page refresh that follows can be slow or cut off under load
  // (incident 25 Oct 2026); the refreshed data replaces them as soon as it arrives.
  const [confirmed, setConfirmed] = useState<{ docs: Record<string, 'ok' | 'rejected'>; checks: Record<string, boolean> }>({
    docs: {},
    checks: {},
  });
  useEffect(() => setConfirmed({ docs: {}, checks: {} }), [data]);
  const docs = data.docs.map((d) => (confirmed.docs[d.id] ? { ...d, status: confirmed.docs[d.id]! } : d));
  const checks = data.checks.map((c) => (c.key in confirmed.checks ? { ...c, on: confirmed.checks[c.key]! } : c));
  const allOk = docs.every((d) => !d.file || d.status === 'ok') && docs.some((d) => d.file);

  // one action at a time; the answer is the server's (callAction turns a failed call into an explicit message)
  const run = async (key: string, fn: () => Promise<ReviewResult>, onConfirmed?: () => void) => {
    if (busy) return null;
    setBusy(key);
    setNote(null);
    const r = await callAction(locale, fn);
    setBusy(null);
    setNote(r);
    if (r.ok) {
      onConfirmed?.();
      setDialog(null);
      setText('');
      startTransition(() => router.refresh());
    }
    return r;
  };
  // also locked while the page refresh after a confirmed action is loading: an action started during that refresh
  // was the one cut off under load
  const locked = busy !== null || refreshing;

  const open = (d: Dialog) => {
    setText('');
    setValue(d && d.kind === 'edit' ? d.field.value : '');
    setDialog(d);
  };

  const actions: ReactNode[] = [
    <button
      key="form"
      type="button"
      className="btn"
      data-action="doc.view"
      onClick={() => setShowForm((s) => !s)}
      aria-expanded={showForm}
    >
      <Ic name="file" size={16} /> {m('officialForm')}
    </button>,
  ];
  if (data.stage === 'submitted' && canWork) {
    actions.push(
      <button
        key="start"
        type="button"
        className="btn btn-primary"
        data-action="adm.app.open"
        disabled={locked}
        title={locked ? m('working') : undefined}
        onClick={() => void run('start', () => startReview(locale, data.id))}
      >
        <Ic name="shield" size={16} /> {busy === 'start' ? m('working') : m('start')}
      </button>,
    );
  }
  if (inReview && canWork) {
    actions.push(
      <button
        key="return"
        type="button"
        className="btn"
        data-action="adm.return"
        onClick={() => open({ kind: 'return' })}
      >
        {m('return')}
      </button>,
    );
    if (canDecide)
      actions.push(
        <button
          key="reject"
          type="button"
          className="btn btn-danger"
          data-action="adm.reject"
          onClick={() => open({ kind: 'reject' })}
        >
          {m('reject')}
        </button>,
      );
    actions.push(
      <button
        key="verify"
        type="button"
        className="btn btn-primary"
        data-action="adm.verify"
        onClick={() => open({ kind: 'verify' })}
      >
        <Check size={16} aria-hidden /> {m('verify')}
      </button>,
    );
  }
  if (canDecide && ['submitted', 'returned', 'proposer'].includes(data.stage)) {
    actions.push(
      <button
        key="reject2"
        type="button"
        className="btn btn-danger"
        data-action="adm.reject"
        onClick={() => open({ kind: 'reject' })}
      >
        {m('reject')}
      </button>,
    );
  }

  const docIcon = (d: ReviewDoc) =>
    !d.file ? (
      <X size={16} color="#ef4444" aria-hidden />
    ) : d.status === 'ok' ? (
      <Check size={16} color="#1fa34a" aria-hidden />
    ) : d.status === 'rejected' ? (
      <X size={16} color="#ef4444" aria-hidden />
    ) : (
      <Clock size={16} color="#f59e0b" aria-hidden />
    );

  const dialogBody = (): {
    title: string;
    intro?: string;
    body: ReactNode;
    ok: () => Promise<ReviewResult>;
    okLabel: string;
    danger?: boolean;
    action: string;
  } | null => {
    if (!dialog) return null;
    const reasonField = (label: string) => (
      <label className="form-field">
        {label}
        <textarea value={text} rows={4} maxLength={1000} onChange={(e) => setText(e.target.value)} required />
      </label>
    );
    switch (dialog.kind) {
      case 'return':
        return {
          title: m('returnTitle'),
          intro: m('returnHelp'),
          body: reasonField(m('note')),
          ok: () => returnApplication(locale, data.id, text),
          okLabel: m('return'),
          action: 'adm.return.confirm',
        };
      case 'reject':
        return {
          title: m('rejectTitle'),
          intro: m('rejectHelp'),
          body: reasonField(m('reason')),
          ok: () => rejectApplication(locale, data.id, text),
          okLabel: m('reject'),
          danger: true,
          action: 'adm.reject.confirm',
        };
      case 'verify':
        return {
          title: m('verifyTitle'),
          intro: m('verifyHelp'),
          body: null,
          ok: () => verifyApplication(locale, data.id),
          okLabel: m('verify'),
          action: 'adm.verify.confirm',
        };
      case 'class':
        return {
          title: m('classTitle'),
          intro: m('classHelp'),
          body: (
            <>
              <label className="form-field">
                {m('kClass')}
                <select value={clsValue} onChange={(e) => setClsValue(e.target.value as 'Corporate' | 'Associate')}>
                  <option value="Corporate">{msg(locale, 'membership.classes.Corporate')}</option>
                  <option value="Associate">{msg(locale, 'membership.classes.Associate')}</option>
                </select>
              </label>
              {reasonField(m('reason'))}
            </>
          ),
          ok: () => setClass(locale, data.id, clsValue, text),
          okLabel: m('save'),
          action: 'adm.cls.confirm',
        };
      case 'doc':
        return {
          title: m('rejectDocTitle', { doc: dialog.doc.short }),
          intro: m('rejectDocHelp'),
          body: reasonField(m('reason')),
          ok: () => reviewDocument(locale, dialog.doc.id, false, text),
          okLabel: m('reject'),
          danger: true,
          action: 'adm.doc.reject.confirm',
        };
      case 'edit':
        return {
          title: m('editTitle', { field: dialog.field.label }),
          intro: m('editHelp'),
          body: (
            <>
              <label className="form-field">
                {m('value')}
                <input
                  type={dialog.field.key === 'est' ? 'date' : 'text'}
                  value={value}
                  maxLength={600}
                  onChange={(e) => setValue(e.target.value)}
                />
              </label>
              {reasonField(m('reason'))}
            </>
          ),
          ok: () => correctField(locale, data.id, dialog.field.key, value, text),
          okLabel: m('save'),
          action: 'adm.edit.confirm',
        };
    }
  };
  const d = dialogBody();

  return (
    <>
      <div className="ph">
        <div>
          <h1>
            {m('title')} · {data.token}
          </h1>
          <p>
            {data.name || '—'} · {data.bizLabel} · <span className={`bd ${data.stageTone}`}>{data.stageLabel}</span>
          </p>
        </div>
        <div className="pb">
          <Link className="btn" href="/admin/requests" data-action="nav">
            {m('back')}
          </Link>
          {actions}
        </div>
      </div>
      <ActionNotice locale={locale} note={note} />
      {showForm && (
        <div className="formv embed" style={{ marginBottom: 18 }}>
          {form}
        </div>
      )}

      <div className="kg">
        <div className="kpi st">
          <div className="ki" style={{ background: '#14b8a622' }}>
            <Ic name="clock" size={28} color="#14b8a6" />
          </div>
          <div>
            <small>{m('kTime')}</small>
            <br />
            <b>{data.kpis.time}</b>
            <p>{data.kpis.timeSub}</p>
          </div>
        </div>
        <div className="kpi st">
          <div className="ki" style={{ background: '#3b82f622' }}>
            <Ic name="folder" size={28} color="#3b82f6" />
          </div>
          <div>
            <small>{m('kDocs')}</small>
            <br />
            <b>{data.kpis.docs}</b>
            <p>{m('kDocsSub')}</p>
          </div>
        </div>
        {canDecide && ['submitted', 'review', 'returned', 'proposer', 'committee'].includes(data.stage) ? (
          <button
            type="button"
            className="kpi"
            data-action="adm.cls"
            onClick={() => open({ kind: 'class' })}
            aria-label={m('classTitle')}
          >
            <div className="ki" style={{ background: '#c8963e22' }}>
              <Ic name="award" size={28} color="#c8963e" />
            </div>
            <div>
              <small>{m('kClass')}</small>
              <br />
              <b>{data.kpis.cls}</b>
              <p>{data.kpis.clsSub}</p>
            </div>
          </button>
        ) : (
          <div className="kpi st">
            <div className="ki" style={{ background: '#c8963e22' }}>
              <Ic name="award" size={28} color="#c8963e" />
            </div>
            <div>
              <small>{m('kClass')}</small>
              <br />
              <b>{data.kpis.cls}</b>
              <p>{data.kpis.clsSub}</p>
            </div>
          </div>
        )}
        <div className="kpi st">
          <div className="ki" style={{ background: '#1fa34a22' }}>
            <Ic name="card" size={28} color="#1fa34a" />
          </div>
          <div>
            <small>{m('kFee')}</small>
            <br />
            <b>{data.kpis.fee}</b>
            <p>{m('kFeeSub')}</p>
          </div>
        </div>
      </div>

      <div className="gr" style={{ gridTemplateColumns: '1.1fr 1fr' }}>
        <div className="card">
          <div className="ch">
            <h3>{m('particulars')}</h3>
            <div className="pb">
              <div className="ofphoto">
                {data.photoUrl && (
                  // eslint-disable-next-line @next/next/no-img-element -- signed URL of a private file
                  <img src={data.photoUrl} alt="" />
                )}
              </div>
            </div>
          </div>
          <div className="tw">
            <table>
              <tbody>
                {data.particulars.map((p) => (
                  <tr className="st" key={p.key}>
                    <td>{p.label}</td>
                    <td>
                      <b>{p.value || '—'}</b>
                      {p.check && (
                        <>
                          {' '}
                          <span className="bd orange">{m('check')}</span>
                        </>
                      )}
                    </td>
                    <td>
                      {inReview && canWork && (
                        <button
                          type="button"
                          className="ib"
                          data-action="adm.edit"
                          aria-label={m('edit', { field: p.label })}
                          onClick={() => open({ kind: 'edit', field: p })}
                        >
                          <Pencil size={16} color="#94a3b8" aria-hidden />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="card">
          <div className="ch">
            <h3>{m('documents', { biz: data.bizLabel })}</h3>
          </div>
          {docs.map((x) => (
            <div className="drow" key={x.key} data-doc={x.key}>
              <span>{docIcon(x)}</span>
              <div>
                <b>
                  {x.short}
                  {!x.required && <small className="opt"> {msg(locale, 'membership.wiz.docs.optional')}</small>}
                </b>
                <small>
                  {x.file
                    ? `${x.file}${x.reason ? ` — ${x.reason}` : ''}${x.reuploaded ? ` (${m('reuploaded')})` : ''} · ${x.status === 'ok' ? m('accepted') : x.status === 'rejected' ? m('rejected') : m('pending')}`
                    : m('notProvided')}
                </small>
              </div>
              {x.file && (
                <>
                  {x.url && (
                    <a className="btn btn-w" href={x.url} target="_blank" rel="noreferrer" data-action="wiz.doc.view">
                      {m('view')}
                    </a>
                  )}
                  {inReview && canWork && (
                    <>
                      <button
                        type="button"
                        className="btn btn-w"
                        data-action="adm.doc.ok"
                        aria-label={m('accept', { doc: x.short })}
                        disabled={locked || x.status === 'ok'}
                        title={x.status === 'ok' ? m('accepted') : locked ? m('working') : undefined}
                        onClick={() =>
                          void run(`ok-${x.id}`, () => reviewDocument(locale, x.id, true), () =>
                            setConfirmed((s) => ({ ...s, docs: { ...s.docs, [x.id]: 'ok' } })),
                          )
                        }
                      >
                        ✓
                      </button>
                      <button
                        type="button"
                        className="btn btn-w"
                        data-action="adm.doc.reject"
                        aria-label={m('rejectDoc', { doc: x.short })}
                        onClick={() => open({ kind: 'doc', doc: x })}
                      >
                        ✕
                      </button>
                    </>
                  )}
                </>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="gr" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
        <div className="card">
          <div className="ch">
            <h3>{m('partners')}</h3>
          </div>
          {data.partners.length ? (
            data.partners.map((p, i) => (
              <div className="li st" key={i}>
                <i style={{ background: '#14b8a622', color: '#14b8a6' }}>{i + 1}</i>
                <div>
                  <b>{p.name || '—'}</b>
                  <small>
                    {p.cnic || '—'} · {p.mobile || '—'}
                  </small>
                </div>
              </div>
            ))
          ) : (
            <p className="muted">{m('partnersNone')}</p>
          )}
        </div>
        <div className="card">
          <div className="ch">
            <h3>{m('endorse')}</h3>
          </div>
          {endorse}
        </div>
        {committee && (
          <div className="card">
            <div className="ch">
              <h3>{msg(locale, 'committee.card.title')}</h3>
            </div>
            {committee}
          </div>
        )}
        <div className="card">
          <div className="ch">
            <h3>{m('checklist')}</h3>
          </div>
          {checks.map((c) => (
            <div className="tg" key={c.key}>
              <div>
                <b>{c.label}</b>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={c.on}
                className={`sw ${c.on ? 'on' : ''}`}
                aria-label={c.label}
                data-action="adm.check"
                disabled={!inReview || !canWork || locked}
                title={!inReview || !canWork ? m('checklist') : locked ? m('working') : undefined}
                onClick={() =>
                  void run(`chk-${c.key}`, () => setCheck(locale, data.id, c.key, !c.on), () =>
                    setConfirmed((s) => ({ ...s, checks: { ...s.checks, [c.key]: !c.on } })),
                  )
                }
              />
            </div>
          ))}
        </div>
      </div>

      <div className="gr" style={{ gridTemplateColumns: '1.4fr 1fr' }}>
        <div className="card">
          <div className="ch">
            <h3>{m('history')}</h3>
          </div>
          <ul className="tl">
            {data.history.map((h, i) => (
              <li key={i} className="d">
                <i>✓</i>
                <div>
                  <b>{h.title}</b>
                  <small>{h.sub}</small>
                </div>
              </li>
            ))}
          </ul>
        </div>
        <div className="card">
          <div className="ch">
            <h3>{m('emails')}</h3>
          </div>
          {data.emails.length ? (
            data.emails.map((e, i) => (
              <div className="li st" key={i}>
                <div>
                  <b>{e.label}</b>
                  <small>{e.at}</small>
                </div>
                <span className={`bd ${e.status === 'sent' ? 'green' : e.status === 'failed' ? 'red' : 'orange'}`}>
                  {e.statusLabel}
                </span>
              </div>
            ))
          ) : (
            <p className="muted">{m('emailNone')}</p>
          )}
        </div>
      </div>

      <Modal
        open={Boolean(d)}
        onOpenChange={(o) => !o && setDialog(null)}
        title={d?.title ?? ''}
        intro={d?.intro}
        closeLabel={msg(locale, 'common.close')}
        footer={
          d && (
            <>
              <button type="button" className="btn" data-action="modal.close" onClick={() => setDialog(null)}>
                {m('cancel')}
              </button>
              <button
                type="button"
                className={`btn ${d.danger ? 'btn-danger' : 'btn-primary'}`}
                data-action={d.action}
                disabled={locked}
                title={locked ? m('working') : undefined}
                onClick={() => void run('dialog', d.ok)}
              >
                {busy === 'dialog' ? m('working') : d.okLabel}
              </button>
            </>
          )
        }
      >
        {d?.body}
        {note && !note.ok && dialog && <ActionNotice locale={locale} note={note} />}
        {dialog?.kind === 'verify' && !allOk && <p className="muted">{m('verifyBlockedDocs')}</p>}
      </Modal>
    </>
  );
}
