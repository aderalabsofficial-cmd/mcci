'use client';

import { Check, Mail, Trash2, Undo2, Upload, X } from 'lucide-react';
import { useEffect, useMemo, useState, useTransition } from 'react';
import { IMPORT_NOTE_KEY } from '@/components/import/import-upload';
import { Kpi } from '@/components/review/kpi';
import { ActionNotice } from '@/components/shared/action-notice';
import { Modal } from '@/components/shared/modal';
import { Link, useRouter } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';
import { callAction, type Outcome } from '@/lib/client/call-action';
import { commitImport, decideImportRow, discardImport, inviteImported, rollbackImport } from '@/lib/import/actions';
import type { ImportData, Issue } from '@/lib/import/normalize';
import { msg } from '@/lib/nav/model';

type Decision = 'create' | 'update' | 'skip';

export interface PreviewRow {
  row_no: number;
  data: ImportData;
  issues: Issue[];
  confidence: number | null;
  match: 'new' | 'exists' | 'possible';
  match_member: string | null;
  decision: Decision;
  result: string | null;
}

export interface PreviewMember {
  member_no: string;
  class: string;
  status: string;
  representative_name: string;
  valid_to: string;
  women: boolean;
  certificate_serial: string;
  company_name: string;
  ntn: string;
  /** imported earlier and not managed on the platform: a file may update it (migration 0360) */
  updatable: boolean;
}

/** invitation counts of a committed import (migration 0406 import_rows.invite_status) */
export interface InviteCounts {
  sent: number;
  failed: number;
  no_email: number;
  has_account: number;
  waiting: number;
}

const PAGE = 100;
const COMPARE = ['class', 'status', 'representative_name', 'valid_to', 'company_name', 'ntn', 'certificate_serial'] as const;
type Filter = 'all' | 'attention' | Decision;

const hasError = (r: PreviewRow) => r.issues.some((i) => i.level === 'error');

/** the decisions a row allows (the database checks the same, migration 0360 api.import_decide) */
function allowed(r: PreviewRow, members: Record<string, PreviewMember>): Decision[] {
  if (hasError(r)) return ['skip'];
  if (r.match === 'exists') return r.match_member && members[r.match_member]?.updatable ? ['skip', 'update'] : ['skip'];
  return ['skip', 'create'];
}

/**
 * The import preview (imp.file → imp.commit): every row with its checks, what it matches in the register, and the
 * decision. Nothing is written until the admin confirms by typing IMPORT; a committed import can be rolled back
 * (reg ≥ 3). Each decision is saved on the server and shown only once the server confirmed it.
 */
export function ImportPreview({
  locale,
  importId,
  fileName,
  status,
  ai,
  rows,
  members,
  canRollback,
  invites,
}: {
  locale: Locale;
  importId: string;
  fileName: string;
  status: 'preview' | 'committed' | 'discarded' | 'rolled_back';
  ai: boolean;
  rows: PreviewRow[];
  members: Record<string, PreviewMember>;
  canRollback: boolean;
  invites: InviteCounts | null;
}) {
  const m = (k: string, v?: Record<string, string>) => msg(locale, `imp.${k}`, v);
  const router = useRouter();
  const [refreshing, startTransition] = useTransition();
  const [decisions, setDecisions] = useState<Record<number, Decision>>({});
  const [filter, setFilter] = useState<Filter>('all');
  const [page, setPage] = useState(0);
  const [busy, setBusy] = useState<string | null>(null);
  const [note, setNote] = useState<Outcome | null>(null);
  const [dialog, setDialog] = useState<'commit' | 'discard' | 'rollback' | null>(null);
  const [inner, setInner] = useState<Outcome | null>(null);
  const [confirm, setConfirm] = useState('');
  const [sending, setSending] = useState<{ sent: number; failed: number } | null>(null);
  const open = status === 'preview';
  const locked = busy !== null || refreshing;

  useEffect(() => {
    // the upload's outcome, carried over from the upload dialog
    try {
      const saved = sessionStorage.getItem(IMPORT_NOTE_KEY);
      if (saved) {
        sessionStorage.removeItem(IMPORT_NOTE_KEY);
        setNote({ ok: true, message: saved });
      }
    } catch {}
  }, []);
  // a fresh server render replaces the locally confirmed decisions
  useEffect(() => setDecisions({}), [rows]);

  const decisionOf = (r: PreviewRow) => decisions[r.row_no] ?? r.decision;
  const tally = useMemo(() => {
    const t = { create: 0, update: 0, skip: 0 };
    for (const r of rows) t[decisions[r.row_no] ?? r.decision]++;
    return t;
  }, [rows, decisions]);
  const shown = rows.filter((r) => {
    if (filter === 'all') return true;
    if (filter === 'attention') return r.issues.length > 0 || r.match !== 'new';
    return decisionOf(r) === filter;
  });
  const pages = Math.max(1, Math.ceil(shown.length / PAGE));
  const at = Math.min(page, pages - 1);
  const slice = shown.slice(at * PAGE, at * PAGE + PAGE);
  const field = (f: string) => msg(locale, `imp.fields.${f}`);
  const issueText = (i: Issue) => m(`issues.${i.code}`, { field: field(i.field) });

  /** the database's result per row (migration 0360 import_commit / import_rollback), in the reader's language */
  const resultText = (res: string | null) => {
    if (!res) return '—';
    const known: Record<string, string> = { created: 'created', updated: 'updated', skipped: 'skipped', 'rolled back': 'rolledBack', 'kept (in use)': 'kept' };
    if (known[res]) return m(`preview.results.${known[res]}`);
    return `${m('preview.results.error')} (${res.replace(/^error: /, '')})`;
  };
  const refresh = () => startTransition(() => router.refresh());
  async function decide(r: PreviewRow, d: Decision) {
    setBusy(`row-${r.row_no}`);
    setNote(null);
    const res = await callAction(locale, () => decideImportRow(locale, importId, r.row_no, d));
    setBusy(null);
    if (res.ok) setDecisions((x) => ({ ...x, [r.row_no]: d }));
    else setNote(res);
  }
  async function finish(key: 'commit' | 'discard' | 'rollback') {
    setBusy(key);
    setInner(null);
    const res = await callAction(locale, () =>
      key === 'commit' ? commitImport(locale, importId, confirm) : key === 'discard' ? discardImport(locale, importId) : rollbackImport(locale, importId),
    );
    setBusy(null);
    if (!res.ok) return setInner(res);
    setDialog(null);
    setConfirm('');
    setNote(res);
    refresh();
    // every member the import created or updated is invited by email (owner's request; migration 0406)
    if (key === 'commit') void invite(false);
  }

  /** imp.invite: batch after batch until none is left; retry also sends the ones whose email failed before */
  async function invite(retry: boolean) {
    setBusy('invite');
    let sent = 0;
    let failed = 0;
    setSending({ sent, failed });
    let again = retry;
    for (;;) {
      const r = await callAction(locale, () => inviteImported(locale, importId, again));
      again = false;
      if (!r.ok || !('left' in r)) {
        setNote(r);
        break;
      }
      sent += r.sent;
      failed += r.failed;
      setSending({ sent, failed });
      if (r.left === 0) {
        const done = m('invite.done', { sent: String(sent), failed: String(failed) });
        // after a commit its outcome stays in view, followed by the invitations'
        setNote((n) => ({ ok: failed === 0, message: n?.ok && !retry ? `${n.message} ${done}` : done }));
        break;
      }
    }
    setBusy(null);
    setSending(null);
    refresh();
  }

  const count = (pred: (r: PreviewRow) => boolean) => rows.filter(pred).length;
  return (
    <section className="card" aria-labelledby="imp-preview" style={{ marginTop: 18 }} data-import-preview={importId} data-status={status}>
      <div className="ch">
        <h3 id="imp-preview">{m('preview.title', { file: fileName })}</h3>
        <span className={`bd ${open ? 'orange' : status === 'committed' ? 'green' : 'red'}`}>{m(`status.${status}`)}</span>
      </div>
      <ActionNotice locale={locale} note={note} />
      {open && <p className="muted" style={{ marginBottom: 8 }}>{m('preview.help')}</p>}
      {ai && (
        <p className="banner orange" style={{ marginBottom: 12 }}>
          {m('preview.ai')}
        </p>
      )}
      <div className="kg">
        <Kpi label={m('preview.kTotal')} value={rows.length} icon="file" color="#3b82f6" />
        <Kpi label={m('preview.kNew')} value={count((r) => r.match === 'new')} icon="plus" color="#1fa34a" />
        <Kpi label={m('preview.kExists')} value={count((r) => r.match === 'exists')} icon="users" color="#8b5cf6" />
        <Kpi label={m('preview.kPossible')} value={count((r) => r.match === 'possible')} icon="eye" color="#f59e0b" />
        <Kpi label={m('preview.kErrors')} value={count(hasError)} icon="x" color="#ef4444" />
      </div>
      <div className="flex flex-wrap items-center gap-2.5" style={{ margin: '8px 0 12px' }}>
        <label className="form-field" style={{ minWidth: 220 }}>
          {m('preview.filter')}
          <select
            value={filter}
            data-action="imp.filter"
            onChange={(e) => {
              setFilter(e.currentTarget.value as Filter);
              setPage(0);
            }}
          >
            {(['all', 'attention', 'create', 'update', 'skip'] as const).map((f) => (
              <option key={f} value={f}>
                {m(`preview.filters.${f}`)}
                {f === 'create' || f === 'update' || f === 'skip' ? ` (${tally[f]})` : ''}
              </option>
            ))}
          </select>
        </label>
      </div>
      {slice.length ? (
        <div className="tw" tabIndex={0} role="region" aria-label={m('preview.title', { file: fileName })}>
          <table>
            <thead>
              <tr>
                {(['row', 'no', 'company', 'details', 'match', 'issues', ...(ai ? ['confidence'] : []), open ? 'decision' : 'result'] as const).map((c) => (
                  <th key={c} scope="col">
                    {m(`preview.cols.${c}`)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {slice.map((r) => {
                const mem = r.match_member ? members[r.match_member] : undefined;
                const diffs =
                  r.match === 'exists' && mem
                    ? COMPARE.filter((f) => String(mem[f] ?? '') !== String(r.data[f] ?? '') && String(r.data[f] ?? '') !== '')
                    : [];
                const d = decisionOf(r);
                return (
                  <tr className="st" key={r.row_no} data-row={r.row_no} data-decision={d} data-match={r.match}>
                    <td>{r.row_no}</td>
                    <td>
                      <b>{r.data.membership_no || '—'}</b>
                    </td>
                    <td>
                      {r.data.company_name || '—'}
                      <br />
                      <small className="muted">{r.data.representative_name || '—'}</small>
                    </td>
                    <td>
                      {r.data.class ? msg(locale, `membership.classes.${r.data.class}`) : '—'}
                      {r.data.women ? ' · W' : ''} · {r.data.status ? msg(locale, `register.status.${r.data.status}`) : '—'} · {r.data.valid_to || '—'}
                    </td>
                    <td>
                      {r.match === 'new' ? (
                        <span className="bd green">{m('preview.match.new')}</span>
                      ) : (
                        <>
                          <span className={`bd ${r.match === 'exists' ? 'blue' : 'orange'}`}>
                            {r.match === 'exists'
                              ? m('preview.match.exists', { no: mem?.member_no ?? r.data.membership_no })
                              : m('preview.match.possible', { no: mem?.member_no ?? '—', company: mem?.company_name ?? '—' })}
                          </span>
                          {r.match === 'exists' && mem && (
                            <small className="muted" style={{ display: 'block', marginTop: 4 }}>
                              {diffs.length
                                ? `${m('preview.differs')}: ${diffs.map((f) => `${field(f)} ${String(mem[f] ?? '—')} → ${String(r.data[f])}`).join('; ')}`
                                : m('preview.same')}
                            </small>
                          )}
                        </>
                      )}
                    </td>
                    <td>
                      {r.issues.length ? (
                        <ul style={{ margin: 0, paddingInlineStart: 16 }}>
                          {r.issues.map((i, k) => (
                            <li key={k} style={{ color: i.level === 'error' ? 'var(--rd, #ef4444)' : undefined }} data-issue={i.code}>
                              {issueText(i)}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <span className="bd green">{m('preview.ok')}</span>
                      )}
                    </td>
                    {ai && <td>{r.confidence === null ? '—' : `${Math.round(r.confidence * 100)}%`}</td>}
                    <td>
                      {open ? (
                        <select
                          aria-label={m('preview.decisionFor', { row: String(r.row_no) })}
                          value={d}
                          disabled={locked || allowed(r, members).length < 2}
                          data-action="imp.decide"
                          onChange={(e) => void decide(r, e.currentTarget.value as Decision)}
                        >
                          {allowed(r, members)
                            .concat(allowed(r, members).includes(d) ? [] : [d])
                            .map((x) => (
                              <option key={x} value={x}>
                                {m(`preview.decisions.${x}`)}
                              </option>
                            ))}
                        </select>
                      ) : (
                        resultText(r.result)
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="em">{m('preview.none')}</p>
      )}
      {pages > 1 && (
        <div className="flex flex-wrap items-center justify-end gap-2.5" style={{ marginTop: 10 }}>
          <span className="muted">
            {m('preview.page', { from: String(at * PAGE + 1), to: String(Math.min(shown.length, at * PAGE + PAGE)), total: String(shown.length) })}
          </span>
          <button type="button" className="btn" data-action="imp.page.prev" disabled={at === 0} onClick={() => setPage(at - 1)}>
            {m('preview.prev')}
          </button>
          <button type="button" className="btn" data-action="imp.page.next" disabled={at >= pages - 1} onClick={() => setPage(at + 1)}>
            {m('preview.next')}
          </button>
        </div>
      )}
      {status === 'committed' && invites && (
        <div
          className="banner"
          style={{ marginTop: 14, background: '#e8f0fb', color: '#0b2a5b', flexDirection: 'column', alignItems: 'flex-start', gap: 4 }}
          data-invites={invites.waiting + invites.failed} aria-live="polite">
          <b>
            <Mail size={16} aria-hidden /> {m('invite.title')}
          </b>
          <p style={{ margin: '4px 0 0' }}>
            {sending
              ? m('invite.sending', { sent: String(sending.sent), failed: String(sending.failed) })
              : m('invite.counts', {
                  sent: String(invites.sent),
                  failed: String(invites.failed),
                  noEmail: String(invites.no_email),
                  hasAccount: String(invites.has_account),
                  waiting: String(invites.waiting),
                })}
          </p>
        </div>
      )}
      <div className="pb" style={{ marginTop: 14 }}>
        {status === 'committed' && invites && (
          <button
            type="button"
            className="btn btn-primary"
            data-action="imp.invite"
            disabled={locked || invites.waiting + invites.failed === 0}
            title={invites.waiting + invites.failed === 0 ? m('invite.nothing') : undefined}
            onClick={() => void invite(true)}
          >
            <Mail size={16} aria-hidden /> {m('invite.send', { n: String(invites.waiting + invites.failed) })}
          </button>
        )}
        {open && (
          <>
            <button
              type="button"
              className="btn btn-primary"
              data-action="imp.commit"
              disabled={locked || tally.create + tally.update === 0}
              onClick={() => (setInner(null), setConfirm(''), setDialog('commit'))}
            >
              <Upload size={16} aria-hidden /> {m('preview.commit')} ({tally.create + tally.update})
            </button>
            <button type="button" className="btn btn-danger" data-action="imp.discard" disabled={locked} onClick={() => (setInner(null), setDialog('discard'))}>
              <Trash2 size={16} aria-hidden /> {m('preview.discard')}
            </button>
          </>
        )}
        {status === 'committed' && canRollback && (
          <button type="button" className="btn btn-danger" data-action="imp.rollback" disabled={locked} onClick={() => (setInner(null), setDialog('rollback'))}>
            <Undo2 size={16} aria-hidden /> {m('preview.rollback')}
          </button>
        )}
        <Link className="btn" href="/admin/import" data-action="imp.close">
          <X size={16} aria-hidden /> {m('preview.close')}
        </Link>
      </div>

      <Modal
        open={dialog === 'commit'}
        onOpenChange={(o) => !o && !busy && setDialog(null)}
        title={m('commitTitle')}
        intro={m('commitHelp', { create: String(tally.create), update: String(tally.update), skip: String(tally.skip) })}
        closeLabel={msg(locale, 'common.close')}
      >
        <form
          className="grid gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            void finish('commit');
          }}
        >
          <label className="form-field">
            {m('commitType')}
            <input value={confirm} onChange={(e) => setConfirm(e.currentTarget.value)} autoComplete="off" required pattern="IMPORT" />
          </label>
          <ActionNotice locale={locale} note={inner} />
          <div className="flex flex-wrap justify-end gap-2.5">
            <button type="button" className="btn" data-action="modal.close" disabled={busy !== null} onClick={() => setDialog(null)}>
              {msg(locale, 'staffActions.cancel')}
            </button>
            <button type="submit" className="btn btn-primary" data-action="imp.commit.confirm" disabled={busy !== null || confirm.trim() !== 'IMPORT'}>
              <Check size={16} aria-hidden /> {m('commitOk')}
            </button>
          </div>
        </form>
      </Modal>
      {(['discard', 'rollback'] as const).map((k) => (
        <Modal
          key={k}
          open={dialog === k}
          onOpenChange={(o) => !o && !busy && setDialog(null)}
          title={m(`${k}Title`)}
          intro={m(`${k}Help`)}
          closeLabel={msg(locale, 'common.close')}
        >
          <ActionNotice locale={locale} note={inner} />
          <div className="flex flex-wrap justify-end gap-2.5">
            <button type="button" className="btn" data-action="modal.close" disabled={busy !== null} onClick={() => setDialog(null)}>
              {msg(locale, 'staffActions.cancel')}
            </button>
            <button type="button" className="btn btn-danger" data-action={`imp.${k}.confirm`} disabled={busy !== null} onClick={() => void finish(k)}>
              {k === 'discard' ? <Trash2 size={16} aria-hidden /> : <Undo2 size={16} aria-hidden />} {m(`${k}Ok`)}
            </button>
          </div>
        </Modal>
      ))}
    </section>
  );
}
