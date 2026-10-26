'use client';

import { FlaskConical, Plus, Trash2, UserCheck } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { ActionNotice } from '@/components/shared/action-notice';
import { Modal } from '@/components/shared/modal';
import type { Locale } from '@/i18n/routing';
import { callAction, type Outcome } from '@/lib/client/call-action';
import { addDemo, clearDemo, markDemo } from '@/lib/demo/actions';
import { msg } from '@/lib/nav/model';

export interface DemoRow {
  company: string;
  memberNo: string | null;
  cls: string | null;
  owner: string;
  expires: string;
}

/** a self-registered applicant that can be marked as demo (api.demo_markable, migration 0405) */
export interface MarkableRow {
  id: string;
  label: string;
}

/**
 * Demo members (migration 0350) for presentations: clearly labelled DEMO accounts that use the real sign-in and
 * proposer & seconder signing, kept apart from official members, numbers and counts; removed in one step.
 */
export function DemoCard({
  locale,
  rows,
  canManage,
  markable = [],
}: {
  locale: Locale;
  rows: DemoRow[];
  canManage: boolean;
  markable?: MarkableRow[];
}) {
  const m = (k: string) => msg(locale, `demo.${k}`);
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [open, setOpen] = useState<'add' | 'clear' | 'mark' | null>(null);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<Outcome | null>(null);
  const [inner, setInner] = useState<Outcome | null>(null);
  const done = (r: Outcome) => {
    setBusy(false);
    if (!r.ok) return setInner(r);
    setOpen(null);
    setNote(r);
    startTransition(() => router.refresh());
  };
  return (
    <section className="card" aria-labelledby="demo-h" style={{ marginTop: 18 }} data-demo-card>
      <div className="ch">
        <h3 id="demo-h">
          <FlaskConical size={18} aria-hidden /> {m('title')}
        </h3>
        <span className="bd orange">{m('badge')}</span>
      </div>
      <p className="muted" style={{ marginBottom: 12 }}>
        {m('help')}
      </p>
      <ActionNotice locale={locale} note={note} />
      {rows.length ? (
        <div className="tw" tabIndex={0} role="region" aria-label={m('title')}>
          <table>
            <thead>
              <tr>
                {(['company', 'no', 'owner', 'expires'] as const).map((c) => (
                  <th key={c} scope="col">
                    {m(`cols.${c}`)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr className="st" key={r.company} data-demo-row={r.memberNo ?? 'applicant'}>
                  <td>{r.company}</td>
                  <td>
                    {r.memberNo ? (
                      <>
                        <b>{r.memberNo}</b> · {r.cls ? msg(locale, `membership.classes.${r.cls}`) : ''}
                      </>
                    ) : (
                      m('applicant')
                    )}
                  </td>
                  <td>{r.owner}</td>
                  <td>{r.expires}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="em">{m('none')}</p>
      )}
      {canManage && (
        <div className="pb" style={{ marginTop: 12 }}>
          <button type="button" className="btn btn-primary" data-action="demo.add" onClick={() => (setInner(null), setOpen('add'))}>
            <Plus size={16} aria-hidden /> {m('add')}
          </button>
          <button
            type="button"
            className="btn"
            data-action="demo.mark"
            disabled={markable.length === 0}
            title={markable.length === 0 ? m('markNoneTitle') : undefined}
            onClick={() => (setInner(null), setOpen('mark'))}
          >
            <UserCheck size={16} aria-hidden /> {m('mark')}
          </button>
          {rows.length > 0 && (
            <button type="button" className="btn btn-danger" data-action="demo.clear" onClick={() => (setInner(null), setOpen('clear'))}>
              <Trash2 size={16} aria-hidden /> {m('clear')}
            </button>
          )}
        </div>
      )}
      <Modal open={open === 'add'} onOpenChange={(o) => !o && setOpen(null)} title={m('addTitle')} intro={m('addHelp')} closeLabel={msg(locale, 'common.close')} wide>
        <form
          className="grid gap-3"
          onSubmit={async (e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            fd.set('locale', locale);
            setBusy(true);
            setInner(null);
            done(await callAction(locale, () => addDemo(fd)));
          }}
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="form-field">
              {m('kind')}
              <select name="kind" defaultValue="member">
                <option value="member">{m('kinds.member')}</option>
                <option value="applicant">{m('kinds.applicant')}</option>
              </select>
            </label>
            <label className="form-field">
              {m('cls')}
              <select name="cls" defaultValue="Associate">
                <option value="Associate">{msg(locale, 'membership.classes.Associate')}</option>
                <option value="Corporate">{msg(locale, 'membership.classes.Corporate')}</option>
              </select>
            </label>
            <label className="form-field">
              {m('company')}
              <input name="company" required minLength={2} maxLength={160} />
            </label>
            <label className="form-field">
              {m('rep')}
              <input name="rep" required minLength={2} maxLength={120} />
            </label>
            <label className="form-field">
              {m('owner')}
              <input name="owner" required minLength={2} maxLength={120} />
            </label>
            <label className="form-field">
              {m('email')}
              <input name="email" type="email" required maxLength={254} />
            </label>
            <label className="form-field">
              {m('days')}
              <input name="days" type="number" min={1} max={30} defaultValue={7} required />
            </label>
          </div>
          <ActionNotice locale={locale} note={inner} />
          <div className="flex flex-wrap justify-end gap-2.5">
            <button type="button" className="btn" data-action="modal.close" onClick={() => setOpen(null)}>
              {msg(locale, 'staffActions.cancel')}
            </button>
            <button type="submit" className="btn btn-primary" data-action="demo.add.confirm" disabled={busy} title={busy ? msg(locale, 'membership.wiz.working') : undefined}>
              {busy ? msg(locale, 'membership.wiz.working') : m('addOk')}
            </button>
          </div>
        </form>
      </Modal>
      <Modal open={open === 'mark'} onOpenChange={(o) => !o && setOpen(null)} title={m('markTitle')} intro={m('markHelp')} closeLabel={msg(locale, 'common.close')} wide>
        <form
          className="grid gap-3"
          onSubmit={async (e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            fd.set('locale', locale);
            setBusy(true);
            setInner(null);
            done(await callAction(locale, () => markDemo(fd)));
          }}
        >
          {markable.length ? (
            <label className="form-field">
              {m('markPick')}
              <select name="company" required defaultValue="">
                <option value="" disabled>
                  —
                </option>
                {markable.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.label}
                  </option>
                ))}
              </select>
            </label>
          ) : (
            <p className="em">{m('markNone')}</p>
          )}
          <ActionNotice locale={locale} note={inner} />
          <div className="flex flex-wrap justify-end gap-2.5">
            <button type="button" className="btn" data-action="modal.close" onClick={() => setOpen(null)}>
              {msg(locale, 'staffActions.cancel')}
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              data-action="demo.mark.confirm"
              disabled={busy || markable.length === 0}
              title={busy ? msg(locale, 'membership.wiz.working') : undefined}
            >
              {busy ? msg(locale, 'membership.wiz.working') : m('markOk')}
            </button>
          </div>
        </form>
      </Modal>
      <Modal
        open={open === 'clear'}
        onOpenChange={(o) => !o && setOpen(null)}
        title={m('clearTitle')}
        intro={m('clearHelp')}
        closeLabel={msg(locale, 'common.close')}
        footer={
          <>
            <button type="button" className="btn" data-action="modal.close" onClick={() => setOpen(null)}>
              {msg(locale, 'staffActions.cancel')}
            </button>
            <button
              type="button"
              className="btn btn-danger"
              data-action="demo.clear.confirm"
              disabled={busy}
              title={busy ? msg(locale, 'membership.wiz.working') : undefined}
              onClick={async () => {
                setBusy(true);
                setInner(null);
                done(await callAction(locale, () => clearDemo(locale)));
              }}
            >
              {busy ? msg(locale, 'membership.wiz.working') : m('clearOk')}
            </button>
          </>
        }
      >
        <ActionNotice locale={locale} note={inner} />
      </Modal>
    </section>
  );
}
