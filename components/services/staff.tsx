'use client';

import { Check, Mail, Pencil, PenTool, Play, Send, Settings, Undo2, X } from 'lucide-react';
import { useState, useTransition } from 'react';
import { ActionNotice } from '@/components/shared/action-notice';
import { Modal } from '@/components/shared/modal';
import { Link, useRouter } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';
import { callAction, type Outcome } from '@/lib/client/call-action';
import { msg } from '@/lib/nav/model';
import { saveService, sendMessage, signAll, staffStep } from '@/lib/services/actions';

type Step = 'start' | 'approve' | 'return' | 'reject' | 'sign';

function useAction(locale: Locale) {
  const router = useRouter();
  const [refreshing, startTransition] = useTransition();
  const [busy, setBusy] = useState<string | null>(null);
  const [note, setNote] = useState<Outcome | null>(null);
  const run = async (key: string, fn: () => Promise<Outcome>) => {
    if (busy) return null;
    setBusy(key);
    setNote(null);
    const r = await callAction(locale, fn);
    setBusy(null);
    setNote(r);
    if (r.ok) startTransition(() => router.refresh());
    return r;
  };
  return { busy, refreshing, locked: busy !== null || refreshing, note, setNote, run };
}

/**
 * The Review Desk buttons (prototype admin/review): start → approve | return | not approve → sign & issue, with the
 * right designation for each (the database checks it again) and a written reason where one is needed.
 */
export function ReviewActions({
  locale,
  requestId,
  status,
  level,
  feeOk,
}: {
  locale: Locale;
  requestId: string;
  status: string;
  level: number;
  feeOk: boolean;
}) {
  const m = (k: string) => msg(locale, `svc.review.${k}`);
  const a = useAction(locale);
  const [dialog, setDialog] = useState<'return' | 'reject' | 'sign' | 'msg' | null>(null);
  const [inner, setInner] = useState<Outcome | null>(null);
  const step = async (s: Step, text = '') => {
    setInner(null);
    const r = await a.run(s, () => staffStep(locale, s, requestId, text));
    if (r?.ok) setDialog(null);
    else if (r && dialog) setInner(r);
  };
  const open = !['Issued', 'Rejected', 'Cancelled'].includes(status);
  return (
    <>
      <div className="pb">
        {level >= 2 && (
          <button type="button" className="btn" data-action="svc.msg" disabled={a.locked} onClick={() => (setInner(null), setDialog('msg'))}>
            <Mail size={16} aria-hidden /> {msg(locale, 'svc.detail.messageMember')}
          </button>
        )}
        {level >= 2 && status === 'Submitted' && (
          <button type="button" className="btn btn-primary" data-action="svc.start" disabled={a.locked} onClick={() => void step('start')}>
            <Play size={16} aria-hidden /> {m('start')}
          </button>
        )}
        {level >= 2 && status === 'In review' && (
          <>
            <button type="button" className="btn" data-action="svc.return" disabled={a.locked} onClick={() => (setInner(null), setDialog('return'))}>
              <Undo2 size={16} aria-hidden /> {m('return')}
            </button>
            <button type="button" className="btn btn-primary" data-action="svc.approve" disabled={a.locked} onClick={() => void step('approve')}>
              <Check size={16} aria-hidden /> {m('approve')}
            </button>
          </>
        )}
        {level >= 3 && status === 'Ready to sign' && (
          <button
            type="button"
            className="btn btn-gold"
            data-action="svc.sign"
            disabled={a.locked || !feeOk}
            title={!feeOk ? m('signNeedsFee') : undefined}
            onClick={() => (setInner(null), setDialog('sign'))}
          >
            <PenTool size={16} aria-hidden /> {m('sign')}
          </button>
        )}
        {level >= 2 && open && status !== 'Submitted' && (
          <button type="button" className="btn btn-danger" data-action="svc.reject" disabled={a.locked} onClick={() => (setInner(null), setDialog('reject'))}>
            <X size={16} aria-hidden /> {m('reject')}
          </button>
        )}
      </div>
      {status === 'Ready to sign' && !feeOk && <p className="muted">{m('signNeedsFee')}</p>}
      <ActionNotice locale={locale} note={a.note} className="mt-3" />
      {(['return', 'reject'] as const).map((k) => (
        <Modal
          key={k}
          open={dialog === k}
          onOpenChange={(o) => !o && !a.busy && setDialog(null)}
          title={m(`${k}Title`)}
          intro={m(`${k}Help`)}
          closeLabel={msg(locale, 'common.close')}
        >
          <form
            className="grid gap-3"
            onSubmit={(e) => {
              e.preventDefault();
              void step(k, String(new FormData(e.currentTarget).get('text') ?? ''));
            }}
          >
            <label className="form-field">
              {k === 'return' ? m('note') : m('reason')}
              <textarea name="text" rows={3} required minLength={3} maxLength={1000} />
            </label>
            <ActionNotice locale={locale} note={inner} />
            <div className="flex justify-end">
              <button type="submit" className={`btn ${k === 'reject' ? 'btn-danger' : 'btn-primary'}`} data-action={`svc.${k}.confirm`} disabled={a.locked}>
                {k === 'return' ? m('return') : m('reject')}
              </button>
            </div>
          </form>
        </Modal>
      ))}
      <Modal open={dialog === 'sign'} onOpenChange={(o) => !o && !a.busy && setDialog(null)} title={m('signTitle')} intro={m('signHelp')} closeLabel={msg(locale, 'common.close')}>
        <ActionNotice locale={locale} note={inner} />
        <div className="flex flex-wrap justify-end gap-2.5">
          <button type="button" className="btn" data-action="modal.close" onClick={() => setDialog(null)}>
            {msg(locale, 'staffActions.cancel')}
          </button>
          <button type="button" className="btn btn-gold" data-action="svc.sign.confirm" disabled={a.locked} onClick={() => void step('sign')}>
            <PenTool size={16} aria-hidden /> {m('sign')}
          </button>
        </div>
      </Modal>
      <Modal open={dialog === 'msg'} onOpenChange={(o) => !o && !a.busy && setDialog(null)} title={msg(locale, 'svc.detail.messageMember')} closeLabel={msg(locale, 'common.close')}>
        <form
          className="grid gap-3"
          onSubmit={async (e) => {
            e.preventDefault();
            const body = String(new FormData(e.currentTarget).get('body') ?? '');
            setInner(null);
            const r = await a.run('msg', () => sendMessage(locale, requestId, body));
            if (r?.ok) setDialog(null);
            else if (r) setInner(r);
          }}
        >
          <label className="form-field">
            {msg(locale, 'svc.detail.messageLabel')}
            <textarea name="body" rows={4} required maxLength={4000} />
          </label>
          <ActionNotice locale={locale} note={inner} />
          <div className="flex justify-end">
            <button type="submit" className="btn btn-primary" data-action="svc.msg.send" disabled={a.locked}>
              <Send size={16} aria-hidden /> {msg(locale, 'svc.detail.send')}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}

export interface QueueRow {
  id: string;
  token: string;
  title: string;
  feeOk: boolean;
}

/**
 * The signatory queue (prototype admin/approvals): sign one (svc.sign) or all whose fee is paid (svc.signAll). The
 * outcome stays on the screen after the signed request has left the list.
 */
export function SigningQueue({ locale, rows, canSign }: { locale: Locale; rows: QueueRow[]; canSign: boolean }) {
  const m = (k: string) => msg(locale, `svc.sign.${k}`);
  const a = useAction(locale);
  const [all, setAll] = useState(false);
  const ready = rows.filter((r) => r.feeOk).length;
  return (
    <>
      {canSign && (
        <div className="pb" style={{ marginBottom: 12 }}>
          <button type="button" className="btn btn-primary" data-action="svc.signAll" disabled={a.locked || ready === 0} onClick={() => setAll(true)}>
            <PenTool size={16} aria-hidden /> {m('all')} ({ready})
          </button>
        </div>
      )}
      <ActionNotice locale={locale} note={a.note} />
      <section className="card" aria-labelledby="rs-h">
        <div className="ch">
          <h3 id="rs-h">{m('ready')}</h3>
        </div>
        {rows.length ? (
          rows.map((r) => (
            <div className="li st" key={r.id} data-request={r.token}>
              <i style={{ background: '#c8963e22' }} aria-hidden>
                <PenTool size={18} color="#c8963e" />
              </i>
              <div style={{ flex: 1 }}>
                <b>{r.title}</b>
                <small>
                  <Link href={`/admin/review?t=${r.token}`} data-action="svc.open">
                    {r.token}
                  </Link>
                  {!r.feeOk ? ` · ${m('feeWaiting')}` : ''}
                </small>
              </div>
              {canSign && (
                <button
                  type="button"
                  className="btn btn-gold btn-w"
                  data-action="svc.sign"
                  disabled={a.locked || !r.feeOk}
                  title={!r.feeOk ? m('feeWaiting') : undefined}
                  onClick={() => void a.run(r.id, () => staffStep(locale, 'sign', r.id))}
                >
                  <PenTool size={16} aria-hidden /> {msg(locale, 'svc.review.sign')}
                </button>
              )}
            </div>
          ))
        ) : (
          <p className="em">{m('none')}</p>
        )}
      </section>
      <Modal open={all} onOpenChange={(o) => !o && !a.busy && setAll(false)} title={m('allTitle')} intro={m('allHelp')} closeLabel={msg(locale, 'common.close')}>
        <div className="flex flex-wrap justify-end gap-2.5">
          <button type="button" className="btn" data-action="modal.close" onClick={() => setAll(false)}>
            {msg(locale, 'staffActions.cancel')}
          </button>
          <button
            type="button"
            className="btn btn-gold"
            data-action="svc.signAll.confirm"
            disabled={a.locked}
            onClick={async () => {
              const r = await a.run('all', () => signAll(locale));
              if (r?.ok) setAll(false);
            }}
          >
            {m('all')}
          </button>
        </div>
      </Modal>
    </>
  );
}

export interface SetupService {
  key: string;
  name: string;
  fee: number;
  sla: number;
  active: boolean;
  docs: string[];
  fields: string[];
}

/** svcset.edit: one service's fee, hours, availability, documents and details (platform staff) */
export function EditService({ locale, service, canEdit }: { locale: Locale; service: SetupService; canEdit: boolean }) {
  const m = (k: string, v?: Record<string, string>) => msg(locale, `svc.setup.${k}`, v);
  const a = useAction(locale);
  const [open, setOpen] = useState(false);
  const [inner, setInner] = useState<Outcome | null>(null);
  return (
    <>
      <button
        type="button"
        className="btn btn-w"
        data-action="svcset.edit"
        aria-label={m('edit', { service: service.name })}
        disabled={!canEdit}
        title={!canEdit ? m('notAllowed') : undefined}
        onClick={() => (setInner(null), setOpen(true))}
      >
        <Pencil size={16} aria-hidden />
      </button>
      <ActionNotice locale={locale} note={a.note} />
      <Modal open={open} onOpenChange={(o) => !o && !a.busy && setOpen(false)} title={m('edit', { service: service.name })} intro={m('sub')} closeLabel={msg(locale, 'common.close')} wide>
        <form
          className="grid gap-3"
          onSubmit={async (e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            fd.set('locale', locale);
            fd.set('key', service.key);
            fd.set('activeField', '1');
            setInner(null);
            const r = await a.run('save', () => saveService(fd));
            if (r?.ok) setOpen(false);
            else if (r) setInner(r);
          }}
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="form-field">
              {m('fee')}
              <input name="fee" type="number" min={0} max={1000000} defaultValue={service.fee} required />
            </label>
            <label className="form-field">
              {m('slaHours')}
              <input name="sla" type="number" min={1} max={720} defaultValue={service.sla} required />
            </label>
          </div>
          <label className="flex items-center gap-2">
            <input type="checkbox" name="active" defaultChecked={service.active} /> {m('active')}
          </label>
          <label className="form-field">
            {m('docs')}
            <textarea name="docs" rows={4} defaultValue={service.docs.join('\n')} required />
          </label>
          <label className="form-field">
            {m('fields')}
            <textarea name="fields" rows={4} defaultValue={service.fields.join('\n')} required />
          </label>
          <ActionNotice locale={locale} note={inner} />
          <div className="flex justify-end">
            <button type="submit" className="btn btn-primary" data-action="svcset.save" disabled={a.locked}>
              {m('save')}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}

/** sla.rules: the response hours of every service in one dialog (platform staff) */
export function SlaRules({ locale, services, canEdit }: { locale: Locale; services: SetupService[]; canEdit: boolean }) {
  const m = (k: string, v?: Record<string, string>) => msg(locale, `svc.sla.${k}`, v);
  const a = useAction(locale);
  const [open, setOpen] = useState(false);
  const [inner, setInner] = useState<Outcome | null>(null);
  return (
    <>
      <button
        type="button"
        className="btn btn-primary"
        data-action="sla.rules"
        disabled={!canEdit}
        title={!canEdit ? m('rulesNotAllowed') : undefined}
        onClick={() => (setInner(null), setOpen(true))}
      >
        <Settings size={16} aria-hidden /> {m('rules')}
      </button>
      <Modal open={open} onOpenChange={(o) => !o && !a.busy && setOpen(false)} title={m('rules')} intro={m('rulesHelp')} closeLabel={msg(locale, 'common.close')}>
        <form
          className="grid gap-3"
          onSubmit={async (e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            setInner(null);
            for (const s of services) {
              const hours = String(fd.get(`h-${s.key}`) ?? s.sla);
              if (Number(hours) === s.sla) continue;
              const one = new FormData();
              one.set('locale', locale);
              one.set('key', s.key);
              one.set('sla', hours);
              const r = await a.run(s.key, () => saveService(one));
              if (!r?.ok) return setInner(r);
            }
            setOpen(false);
          }}
        >
          {services.map((s) => (
            <label className="form-field" key={s.key}>
              {m('hours', { service: s.name })}
              <input name={`h-${s.key}`} type="number" min={1} max={720} defaultValue={s.sla} required />
            </label>
          ))}
          <ActionNotice locale={locale} note={inner} />
          <div className="flex justify-end">
            <button type="submit" className="btn btn-primary" data-action="sla.rules.save" disabled={a.locked}>
              {m('save')}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}
