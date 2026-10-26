'use client';

import { Check, FileText, Mail, Send, Sparkles, Trash2, Upload, X } from 'lucide-react';
import { useEffect, useState, useTransition } from 'react';
import { Ic } from '@/components/membership/ui';
import { ActionNotice } from '@/components/shared/action-notice';
import { Modal } from '@/components/shared/modal';
import { useRouter } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';
import { callAction, type Outcome } from '@/lib/client/call-action';
import { msg } from '@/lib/nav/model';
import {
  cancelRequest,
  newRequest,
  readWithAi,
  removeDocument,
  resubmitRequest,
  saveDetails,
  sendMessage,
  submitRequest,
  uploadDocument,
} from '@/lib/services/actions';

export interface PickService {
  key: string;
  name: string;
  ur: string;
  fee: number;
  hours: number;
  icon: string;
  color: string;
}

/** svc.new: the seven services as big tiles (prototype .btg.svc); locked until the membership is active */
export function ServicePicker({ locale, companyId, services, open }: { locale: Locale; companyId: string; services: PickService[]; open: boolean }) {
  const m = (k: string, v?: Record<string, string>) => msg(locale, `svc.apply.${k}`, v);
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [note, setNote] = useState<Outcome | null>(null);
  return (
    <>
      <ActionNotice locale={locale} note={note} />
      <div className="btg svc">
        {services.map((s) => (
          <button
            key={s.key}
            type="button"
            className="bt"
            data-action="svc.new"
            data-service={s.key}
            disabled={!open || busy !== null}
            aria-label={m('start', { service: s.name })}
            onClick={async () => {
              setBusy(s.key);
              setNote(null);
              const r = await callAction(locale, () => newRequest(locale, companyId, s.key));
              setBusy(null);
              if (!r.ok || !('id' in r) || !r.id) return setNote(r);
              router.push(`/portal/apply?r=${r.id}`);
            }}
          >
            <i style={{ background: `${s.color}22` }}>
              <Ic name={s.icon} size={30} color={s.color} />
            </i>
            <b>{s.name}</b>
            <span lang="ur">{s.ur}</span>
            <small>{s.fee > 0 ? m('tile', { fee: s.fee.toLocaleString('en-US'), hours: String(s.hours) }) : m('free', { hours: String(s.hours) })}</small>
          </button>
        ))}
      </div>
    </>
  );
}

export interface DocItem {
  id: string;
  file_name: string | null;
  url: string | null;
}

/** documents of a request: list with remove (svc.filedel) and an upload button (svc.file), one file at a time */
function Documents({
  locale,
  requestId,
  docs,
  editable,
  onCount,
}: {
  locale: Locale;
  requestId: string;
  docs: DocItem[];
  editable: boolean;
  onCount?: (n: number) => void;
}) {
  const m = (k: string, v?: Record<string, string>) => msg(locale, `svc.apply.${k}`, v);
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<Outcome | null>(null);
  // what the server confirmed is shown at once, not only after the page data comes back
  const [added, setAdded] = useState<DocItem[]>([]);
  const [removed, setRemoved] = useState<string[]>([]);
  const shown = [...docs, ...added.filter((x) => !docs.some((d) => d.id === x.id))].filter((d) => !removed.includes(d.id));
  useEffect(() => onCount?.(shown.length), [shown.length, onCount]);
  const after = (r: Outcome) => {
    setBusy(false);
    setNote(r);
    if (r.ok) startTransition(() => router.refresh());
  };
  return (
    <div>
      {editable && (
        <label className="dz" data-action="svc.file" style={{ display: 'block' }}>
          <Upload size={40} color="#c8963e" aria-hidden />
          <h3>{m('drop')}</h3>
          <p>{m('dropSub')}</p>
          <input
            type="file"
            aria-label={m('file')}
            accept=".pdf,.jpg,.jpeg,.png,.heic,application/pdf,image/jpeg,image/png,image/heic"
            multiple
            disabled={busy}
            className="sr-only"
            onChange={async (e) => {
              const files = Array.from(e.currentTarget.files ?? []);
              e.currentTarget.value = '';
              setBusy(true);
              setNote(null);
              let last: Outcome & { doc?: { id: string; file_name: string } } = { ok: true, message: '' };
              for (const f of files) {
                const fd = new FormData();
                fd.set('locale', locale);
                fd.set('request', requestId);
                fd.set('file', f);
                last = await callAction(locale, () => uploadDocument(fd));
                if (!last.ok) break;
                const doc = last.doc;
                if (doc) setAdded((x) => [...x, { id: doc.id, file_name: doc.file_name, url: null }]);
              }
              after(last);
            }}
          />
        </label>
      )}
      <ActionNotice locale={locale} note={note} />
      <div className="fl">
        {shown.length ? (
          shown.map((d) => (
            <div className="fr" key={d.id} data-doc={d.file_name ?? ''}>
              <FileText size={18} color="#3b82f6" aria-hidden />
              {d.url ? (
                <a href={d.url} target="_blank" rel="noopener noreferrer" data-action="doc.view">
                  {d.file_name}
                </a>
              ) : (
                <span>{d.file_name}</span>
              )}
              {editable && (
                <button
                  type="button"
                  className="ib"
                  data-action="svc.filedel"
                  aria-label={m('remove', { file: d.file_name ?? '' })}
                  disabled={busy}
                  onClick={async () => {
                    setBusy(true);
                    const r = await callAction(locale, () => removeDocument(locale, d.id, d.file_name ?? ''));
                    if (r.ok) setRemoved((x) => [...x, d.id]);
                    after(r);
                  }}
                >
                  <Trash2 size={16} color="#ef4444" aria-hidden />
                </button>
              )}
            </div>
          ))
        ) : (
          <p className="em">{m('noFiles')}</p>
        )}
      </div>
    </div>
  );
}

/**
 * The 4-step request (prototype member/apply with a service chosen): upload documents → AI reads (optional) → check the
 * details → fee and submit. Details are saved on the server whenever the member moves on.
 */
export function ServiceWizard({
  locale,
  request,
  service,
  docs,
  aiOn,
}: {
  locale: Locale;
  request: { id: string; data: Record<string, string> };
  service: { name: string; ur: string; fee: number; hours: number; docs: string[]; fields: string[]; note: string };
  docs: DocItem[];
  aiOn: boolean;
}) {
  const m = (k: string, v?: Record<string, string>) => msg(locale, `svc.apply.${k}`, v);
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [values, setValues] = useState<Record<string, string>>(() => ({ ...request.data }));
  const [ai, setAi] = useState<Record<string, number>>({});
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<Outcome | null>(null);
  const [cancel, setCancel] = useState(false);
  const [docCount, setDocCount] = useState(docs.length);
  const save = async () => {
    const r = await callAction(locale, () => saveDetails(locale, request.id, values));
    if (!r.ok) setNote(r);
    return r.ok;
  };
  const go = async (n: number) => {
    if (step === 3 && n > 3) {
      setBusy(true);
      const ok = await save();
      setBusy(false);
      if (!ok) return;
    }
    setNote(null);
    setStep(n);
  };
  const steps = ['upload', 'ai', 'check', 'submit'] as const;
  return (
    <>
      <div className="ph">
        <div>
          <h1>{service.name}</h1>
          <p lang="ur" className="ur-line">
            {service.ur}
          </p>
        </div>
        <div className="pb">
          <button type="button" className="btn" data-action="svc.cancel" onClick={() => setCancel(true)}>
            <X size={16} aria-hidden /> {m('cancel')}
          </button>
        </div>
      </div>
      <div className="wz-steps sm">
        {steps.map((s, i) => (
          <button
            key={s}
            type="button"
            className={i + 1 < step ? 'd' : i + 1 === step ? 'n' : ''}
            data-action="svc.step"
            aria-current={i + 1 === step ? 'step' : undefined}
            onClick={() => void go(i + 1)}
          >
            <i>{i + 1 < step ? '✓' : i + 1}</i>
            <b>{m(`steps.${s}`)}</b>
          </button>
        ))}
      </div>
      <div className="card wz-body" data-step={step}>
        <ActionNotice locale={locale} note={note} />
        {step === 1 && (
          <>
            <p className="muted" style={{ marginBottom: 10 }}>
              {m('youNeed', { docs: service.docs.join(' · ') })}
            </p>
            <Documents locale={locale} requestId={request.id} docs={docs} editable onCount={setDocCount} />
            <div className="pb" style={{ marginTop: 14 }}>
              <button
                type="button"
                className="btn btn-gold btn-big"
                data-action="svc.ai"
                disabled={!aiOn || busy || !docCount}
                title={!aiOn ? m('aiOff') : undefined}
                onClick={async () => {
                  setBusy(true);
                  setNote(null);
                  const r = await callAction(locale, () => readWithAi(locale, request.id), 65_000);
                  setBusy(false);
                  setNote(r);
                  if (r.ok && 'values' in r && r.values) {
                    setValues((v) => ({ ...v, ...r.values }));
                    setAi(r.confidence ?? {});
                    setStep(3);
                  }
                }}
              >
                <Sparkles size={18} aria-hidden /> {m('readAi')}
              </button>
              <button type="button" className="btn btn-primary" data-action="svc.step" onClick={() => void go(3)}>
                {m('typeMyself')}
              </button>
            </div>
            {!aiOn && <p className="muted">{m('aiOff')}</p>}
          </>
        )}
        {step === 2 && (
          <div className="pb">
            <button type="button" className="btn" data-action="svc.step" onClick={() => void go(1)}>
              {m('back')}
            </button>
            <button type="button" className="btn btn-primary" data-action="svc.step" onClick={() => void go(3)}>
              {m('typeMyself')}
            </button>
          </div>
        )}
        {step === 3 && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void go(4);
            }}
          >
            <h2 className="wz-h">{m('checkTitle')}</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {service.fields.map((f) => (
                <label className="form-field" key={f}>
                  {f}
                  <input
                    value={values[f] ?? ''}
                    required
                    maxLength={500}
                    data-ai={ai[f] !== undefined ? 'filled' : undefined}
                    onChange={(e) => {
                      const v = e.currentTarget.value;
                      setValues((x) => ({ ...x, [f]: v }));
                      setAi(({ [f]: _, ...rest }) => rest);
                    }}
                  />
                  {ai[f] !== undefined && <small className="muted">{m('aiValue')}</small>}
                </label>
              ))}
            </div>
            <div className="pb" style={{ marginTop: 14 }}>
              <button type="submit" className="btn btn-primary btn-big" data-action="svc.step" disabled={busy}>
                {m('continue')} →
              </button>
            </div>
          </form>
        )}
        {step === 4 && (
          <>
            <h2 className="wz-h">{m('feeTitle')}</h2>
            <div className="kv">
              {(
                [
                  ['service', service.name],
                  ['fee', service.fee > 0 ? `PKR ${service.fee.toLocaleString('en-US')}` : m('kv.noFee')],
                  ['response', m('kv.responseVal', { hours: String(service.hours) })],
                  ['payment', service.fee > 0 ? m('kv.paymentVal') : m('kv.noFee')],
                  ['documents', m('kv.documentsVal', { n: String(docCount) })],
                  ['output', m('kv.outputVal')],
                ] as const
              ).map(([k, v]) => (
                <div key={k}>
                  <small className="muted" style={{ display: 'block' }}>
                    {m(`kv.${k}`)}
                  </small>
                  <b>{v}</b>
                </div>
              ))}
            </div>
            <div className="pb" style={{ marginTop: 16 }}>
              <button type="button" className="btn" data-action="svc.step" onClick={() => void go(3)}>
                {m('back')}
              </button>
              <button
                type="button"
                className="btn btn-gold btn-big"
                data-action="svc.submit"
                disabled={busy}
                onClick={async () => {
                  setBusy(true);
                  setNote(null);
                  const r = await callAction(locale, () => submitRequest(locale, request.id, values));
                  setBusy(false);
                  if (!r.ok || !('token' in r) || !r.token) return setNote(r);
                  try {
                    sessionStorage.setItem('mcci.svc.note', r.message);
                  } catch {}
                  router.push(`/portal/application?t=${r.token}`);
                }}
              >
                <Send size={18} aria-hidden /> {m('submit')}
              </button>
            </div>
          </>
        )}
      </div>
      <p className="muted" style={{ marginTop: 10 }}>
        {service.note}
      </p>
      <Modal open={cancel} onOpenChange={(o) => !o && !busy && setCancel(false)} title={m('cancelTitle')} intro={m('cancelHelp')} closeLabel={msg(locale, 'common.close')}>
        <div className="flex flex-wrap justify-end gap-2.5">
          <button type="button" className="btn" data-action="modal.close" onClick={() => setCancel(false)}>
            {m('keep')}
          </button>
          <button
            type="button"
            className="btn btn-danger"
            data-action="svc.cancel.confirm"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              const r = await callAction(locale, () => cancelRequest(locale, request.id));
              setBusy(false);
              if (!r.ok) return setNote(r);
              router.push('/portal/applications');
            }}
          >
            {m('cancelOk')}
          </button>
        </div>
      </Modal>
    </>
  );
}

/** request detail actions for the member: message MCCI (svc.msg), and after a return the correction (svc.fix) */
export function RequestActions({
  locale,
  request,
  returned,
  fields,
  docs,
}: {
  locale: Locale;
  request: { id: string; data: Record<string, string> };
  returned: boolean;
  fields: string[];
  docs: DocItem[];
}) {
  const m = (k: string) => msg(locale, `svc.detail.${k}`);
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [open, setOpen] = useState<'msg' | 'fix' | null>(null);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<Outcome | null>(null);
  const [inner, setInner] = useState<Outcome | null>(null);
  const [values, setValues] = useState<Record<string, string>>(() => ({ ...request.data }));
  const finish = (r: Outcome) => {
    setBusy(false);
    if (!r.ok) return setInner(r);
    setOpen(null);
    setNote(r);
    startTransition(() => router.refresh());
  };
  return (
    <>
      <div className="pb">
        <button type="button" className="btn" data-action="svc.msg" onClick={() => (setInner(null), setOpen('msg'))}>
          <Mail size={16} aria-hidden /> {m('message')}
        </button>
        {returned && (
          <button type="button" className="btn btn-gold" data-action="svc.fix" onClick={() => (setInner(null), setOpen('fix'))}>
            <Upload size={16} aria-hidden /> {m('fix')}
          </button>
        )}
      </div>
      <ActionNotice locale={locale} note={note} className="mt-3" />
      <Modal open={open === 'msg'} onOpenChange={(o) => !o && !busy && setOpen(null)} title={m('message')} closeLabel={msg(locale, 'common.close')}>
        <form
          className="grid gap-3"
          onSubmit={async (e) => {
            e.preventDefault();
            const body = String(new FormData(e.currentTarget).get('body') ?? '');
            setBusy(true);
            finish(await callAction(locale, () => sendMessage(locale, request.id, body)));
          }}
        >
          <label className="form-field">
            {m('messageLabel')}
            <textarea name="body" rows={4} required maxLength={4000} />
          </label>
          <ActionNotice locale={locale} note={inner} />
          <div className="flex justify-end">
            <button type="submit" className="btn btn-primary" data-action="svc.msg.send" disabled={busy}>
              <Send size={16} aria-hidden /> {m('send')}
            </button>
          </div>
        </form>
      </Modal>
      <Modal open={open === 'fix'} onOpenChange={(o) => !o && !busy && setOpen(null)} title={m('fixTitle')} intro={m('fixHelp')} closeLabel={msg(locale, 'common.close')} wide>
        <Documents locale={locale} requestId={request.id} docs={docs} editable />
        <form
          className="grid gap-3"
          style={{ marginTop: 12 }}
          onSubmit={async (e) => {
            e.preventDefault();
            const n = String(new FormData(e.currentTarget).get('note') ?? '');
            setBusy(true);
            finish(await callAction(locale, () => resubmitRequest(locale, request.id, values, n)));
          }}
        >
          <div className="grid gap-3 sm:grid-cols-2">
            {fields.map((f) => (
              <label className="form-field" key={f}>
                {f}
                <input value={values[f] ?? ''} required maxLength={500} onChange={(e) => setValues((x) => ({ ...x, [f]: e.currentTarget.value }))} />
              </label>
            ))}
          </div>
          <label className="form-field">
            {m('noteLabel')}
            <textarea name="note" rows={2} maxLength={1000} />
          </label>
          <ActionNotice locale={locale} note={inner} />
          <div className="flex justify-end">
            <button type="submit" className="btn btn-gold" data-action="svc.fix.send" disabled={busy}>
              <Check size={16} aria-hidden /> {m('sendBack')}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}
