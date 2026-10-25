'use client';

import { FileText, Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { Modal } from '@/components/shared/modal';
import type { Locale } from '@/i18n/routing';
import { type CommitteeResult, createMeeting, recordMinutes } from '@/lib/committee/actions';
import { msg } from '@/lib/nav/model';

const COMMITTEES = ['Membership Committee', 'Executive Committee', 'General Body'] as const;

export interface MeetingRow {
  id: string;
  name: string;
  committee: string;
  date: string;
  agenda: string;
  status: 'Pending' | 'Approved';
  minutes: string | null;
}

/**
 * Meetings & Minutes (prototype admin/meetings): "Schedule meeting" (mt.create) and "Record minutes" per meeting
 * (mt.minutes). Scheduling a Membership Committee meeting puts the files already waiting for the committee on its agenda.
 */
export function MeetingsTable({
  locale,
  rows,
  canEdit,
  today,
}: {
  locale: Locale;
  rows: MeetingRow[];
  canEdit: boolean;
  today: string;
}) {
  const m = (k: string, v?: Record<string, string>) => msg(locale, `committee.meetings.${k}`, v);
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [dialog, setDialog] = useState<{ kind: 'create' } | { kind: 'minutes'; row: MeetingRow } | null>(null);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<CommitteeResult | null>(null);
  const [inner, setInner] = useState<CommitteeResult | null>(null);
  const [minutes, setMinutes] = useState('');

  const done = (r: CommitteeResult) => {
    setBusy(false);
    if (!r.ok) return setInner(r);
    setDialog(null);
    setNote(r);
    startTransition(() => router.refresh());
  };

  return (
    <>
      {canEdit && (
        <div className="pb" style={{ marginBottom: 12 }}>
          <button
            type="button"
            className="btn btn-primary"
            data-action="mt.create"
            onClick={() => (setInner(null), setDialog({ kind: 'create' }))}
          >
            <Plus size={16} aria-hidden /> {m('schedule')}
          </button>
        </div>
      )}
      {note && (
        <div className={`banner ${note.ok ? 'green' : 'red'}`} role={note.ok ? 'status' : 'alert'} style={{ marginBottom: 12 }}>
          <span>{note.message}</span>
        </div>
      )}
      <div className="card">
        <div className="ch">
          <h3>{m('table')}</h3>
        </div>
        <div className="tw" tabIndex={0} role="region" aria-label={m('table')}>
          <table>
            <thead>
              <tr>
                {(['meeting', 'committee', 'date', 'agenda', 'status'] as const).map((c) => (
                  <th key={c} scope="col">
                    {m(`cols.${c}`)}
                  </th>
                ))}
                {canEdit && <th scope="col">{m('cols.minutes')}</th>}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr className="st" key={r.id} data-meeting={r.id}>
                  <td>
                    <b>{r.name}</b>
                    <br />
                    <small className="muted">{r.id}</small>
                  </td>
                  <td>{msg(locale, `committee.names.${COMMITTEES.indexOf(r.committee as (typeof COMMITTEES)[number])}`)}</td>
                  <td>{r.date}</td>
                  <td style={{ whiteSpace: 'pre-line' }}>{r.minutes || r.agenda}</td>
                  <td>
                    <span className={`bd ${r.status === 'Approved' ? 'green' : 'blue'}`}>{m(`status.${r.status}`)}</span>
                  </td>
                  {canEdit && (
                    <td>
                      <button
                        type="button"
                        className="btn btn-w"
                        data-action="mt.minutes"
                        onClick={() => {
                          setInner(null);
                          setMinutes(r.minutes ?? '');
                          setDialog({ kind: 'minutes', row: r });
                        }}
                      >
                        <FileText size={16} aria-hidden /> {m(r.minutes ? 'editMinutes' : 'recordMinutes')}
                      </button>
                    </td>
                  )}
                </tr>
              ))}
              {!rows.length && (
                <tr className="st">
                  <td colSpan={canEdit ? 6 : 5} className="em">
                    {m('none')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        open={dialog?.kind === 'create'}
        onOpenChange={(o) => !o && setDialog(null)}
        title={m('schedule')}
        intro={m('scheduleHelp')}
        closeLabel={msg(locale, 'common.close')}
      >
        <form
          className="grid gap-3"
          onSubmit={async (e) => {
            // a submit handler, not a form action: React would clear the fields when the server refuses
            e.preventDefault();
            setBusy(true);
            setInner(null);
            done(await createMeeting(locale, new FormData(e.currentTarget)));
          }}
        >
          <label className="form-field">
            {m('name')}
            <input name="name" required minLength={2} maxLength={120} />
          </label>
          <label className="form-field">
            {m('committee')}
            <select name="committee" defaultValue="Membership Committee">
              {COMMITTEES.map((c, i) => (
                <option key={c} value={c}>
                  {msg(locale, `committee.names.${i}`)}
                </option>
              ))}
            </select>
          </label>
          <label className="form-field">
            {m('date')}
            <input name="date" type="date" required defaultValue={today} />
          </label>
          {inner && !inner.ok && (
            <p role="alert" style={{ color: '#b91c1c', fontWeight: 700 }}>
              {inner.message}
            </p>
          )}
          <div className="flex flex-wrap justify-end gap-2.5">
            <button type="button" className="btn" data-action="modal.close" onClick={() => setDialog(null)}>
              {m('cancel')}
            </button>
            <button type="submit" className="btn btn-primary" data-action="mt.create.confirm" disabled={busy} title={busy ? msg(locale, 'membership.wiz.working') : undefined}>
              {busy ? msg(locale, 'membership.wiz.working') : m('scheduleOk')}
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        open={dialog?.kind === 'minutes'}
        onOpenChange={(o) => !o && setDialog(null)}
        title={dialog?.kind === 'minutes' ? m('minutesTitle', { name: dialog.row.name }) : ''}
        closeLabel={msg(locale, 'common.close')}
        wide
        footer={
          <>
            <button type="button" className="btn" data-action="modal.close" onClick={() => setDialog(null)}>
              {m('cancel')}
            </button>
            <button
              type="button"
              className="btn btn-primary"
              data-action="mt.minutes.confirm"
              disabled={busy}
              title={busy ? msg(locale, 'membership.wiz.working') : undefined}
              onClick={async () => {
                if (dialog?.kind !== 'minutes') return;
                setBusy(true);
                setInner(null);
                done(await recordMinutes(locale, dialog.row.id, minutes));
              }}
            >
              {busy ? msg(locale, 'membership.wiz.working') : m('saveMinutes')}
            </button>
          </>
        }
      >
        <label className="form-field">
          {m('minutes')}
          <textarea value={minutes} rows={8} maxLength={20000} required onChange={(e) => setMinutes(e.target.value)} />
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
