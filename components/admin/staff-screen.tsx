'use client';

import { ArrowUpDown, Award, Download, Mail, RefreshCw, Search, Shield, Users } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { LimitsCard } from '@/components/admin/limits-card';
import { ActionForm, Hidden } from '@/components/shared/action-form';
import { FormMessage, Modal } from '@/components/shared/modal';
import type { Locale } from '@/i18n/routing';
import type { ActionResult } from '@/lib/access/result';
import { formatAgo, formatDate } from '@/lib/format';
import { msg } from '@/lib/nav/model';
import type { Level } from '@/lib/permissions/levels';
import {
  inviteStaff,
  resendStaffInvite,
  resetStaffMfa,
  revokeStaffInvite,
  updateStaff,
} from '@/lib/staff/actions';
import { cn } from '@/lib/utils';

export interface StaffRow {
  kind: 'staff' | 'invitation';
  /** user id for staff, invitation id for invitations */
  id: string;
  name: string;
  email: string;
  designation: string;
  seniority: number;
  status: 'Active' | 'Disabled' | 'Invited' | 'Expired';
  totp: boolean;
  lastActive: string | null;
  sentAt: string | null;
  expiresAt: string | null;
  self: boolean;
}

const BADGE: Record<StaffRow['status'], string> = {
  Active: 'badge-green',
  Invited: 'badge-orange',
  Expired: 'badge-red',
  Disabled: 'badge',
};

/** Prototype access.js `staff` page: KPIs, staff table (row opens the person), limits by designation. */
export function StaffScreen({
  locale,
  canManage,
  me,
  rows,
  designations,
  limits,
}: {
  locale: Locale;
  canManage: boolean;
  me: { name: string; designation: string };
  rows: StaffRow[];
  designations: { name: string; seniority: number }[];
  limits: Record<string, Record<string, Level>>;
}) {
  const t = (k: string, vars?: Record<string, string>) => msg(locale, `access.staff.${k}`, vars);
  const [inviting, setInviting] = useState(false);
  const [openRow, setOpenRow] = useState<StaffRow | null>(null);
  const [notice, setNotice] = useState<ActionResult | null>(null);
  const done = (r: ActionResult) => {
    setNotice(r);
    if (r.ok) {
      setInviting(false);
      setOpenRow(null);
    }
  };

  const active = rows.filter((r) => r.kind === 'staff' && r.status === 'Active').length;
  const pending = rows.filter((r) => r.kind === 'invitation' && r.status === 'Invited').length;

  return (
    <>
      <p className="-mt-2 mb-4 text-muted sm:-mt-3">{t('subtitle')}</p>
      <div className="mb-4 flex flex-wrap gap-2.5">
        <button
          type="button"
          className="btn btn-primary"
          data-action="staff.invite"
          disabled={!canManage}
          title={canManage ? undefined : t('readOnly')}
          onClick={() => setInviting(true)}
        >
          <Mail className="size-4" aria-hidden />
          {t('invite')}
        </button>
      </div>
      {!canManage && (
        <p role="note" className="mb-4 rounded-[10px] border border-line bg-card2 px-3 py-2 text-[14px] text-muted">
          {t('readOnly')}
        </p>
      )}
      <div aria-live="polite" className="mb-4 empty:hidden">
        {notice && <FormMessage result={notice} />}
      </div>

      <div className="mb-[var(--gap)] grid grid-cols-2 gap-[var(--gap)] lg:grid-cols-4">
        <Kpi
          icon={<Users className="size-6" aria-hidden />}
          tone="#1fa34a"
          label={t('kpiActive')}
          value={String(active)}
          hint={t('kpiActiveHint')}
        />
        <Kpi
          icon={<Mail className="size-6" aria-hidden />}
          tone="#ea8a00"
          label={t('kpiPending')}
          value={String(pending)}
          hint={t('kpiPendingHint')}
        />
        <Kpi
          icon={<Award className="size-6" aria-hidden />}
          tone="#c8963e"
          label={t('kpiDesignations')}
          value={String(designations.length)}
          hint={t('kpiDesignationsHint')}
        />
        <Kpi
          icon={<Shield className="size-6" aria-hidden />}
          tone="#1b4f9c"
          label={t('kpiYou')}
          value={me.name.split(' ')[0] || '—'}
          hint={me.designation}
        />
      </div>

      <StaffTable locale={locale} rows={rows} onOpen={setOpenRow} />

      <LimitsCard
        locale={locale}
        canManage={canManage}
        designations={designations}
        limits={limits}
        onDone={setNotice}
        card={(title, action, children) => (
          <Card title={String(title)} action={action}>
            {children}
          </Card>
        )}
      />

      {inviting && (
        <InviteDialog locale={locale} designations={designations} onClose={() => setInviting(false)} onDone={done} />
      )}
      {openRow && (
        <PersonDialog
          locale={locale}
          row={openRow}
          canManage={canManage}
          designations={designations}
          onClose={() => setOpenRow(null)}
          onDone={done}
        />
      )}
    </>
  );
}

type SortKey = 'name' | 'designation' | 'seniority' | 'email' | 'lastActive' | 'status';
const COLUMNS: [SortKey, string][] = [
  ['name', 'colName'],
  ['designation', 'colDesignation'],
  ['seniority', 'colSeniority'],
  ['email', 'colEmail'],
  ['lastActive', 'colLastActive'],
  ['status', 'colStatus'],
];
const when = (r: StaffRow) => (r.kind === 'invitation' ? r.sentAt : r.lastActive) ?? '';

/** Prototype M.table: search, status filter, sortable columns, record count, CSV export of what is shown. */
function StaffTable({ locale, rows, onOpen }: { locale: Locale; rows: StaffRow[]; onOpen: (r: StaffRow) => void }) {
  const t = (k: string, vars?: Record<string, string>) => msg(locale, `access.staff.${k}`, vars);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('');
  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 } | null>(null);
  const statuses = [...new Set(rows.map((r) => r.status))];
  const q = query.trim().toLowerCase();
  const shown = rows
    .filter((r) => !status || r.status === status)
    .filter((r) => !q || [r.name, r.email, r.designation].some((v) => v.toLowerCase().includes(q)))
    .sort((a, b) => {
      if (!sort) return 0;
      const va = sort.key === 'lastActive' ? when(a) : a[sort.key];
      const vb = sort.key === 'lastActive' ? when(b) : b[sort.key];
      return (va < vb ? -1 : va > vb ? 1 : 0) * sort.dir;
    });
  const lastCell = (r: StaffRow) =>
    r.kind === 'invitation' ? t('invitedOn', { date: formatAgo(locale, r.sentAt) }) : formatAgo(locale, r.lastActive);

  const exportCsv = () => {
    const cell = (v: string) => `"${v.replace(/"/g, '""')}"`;
    const lines = [
      COLUMNS.map(([, c]) => cell(t(c))).join(','),
      ...shown.map((r) =>
        [r.name, r.designation, `L${r.seniority}`, r.email, when(r), msg(locale, `access.status.${r.status}`)]
          .map(cell)
          .join(','),
      ),
    ];
    // BOM so Excel opens the Urdu text as UTF-8
    const blob = new Blob(['﻿' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'mcci-staff.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Card
      title={t('tableTitle')}
      action={
        <button
          type="button"
          className="btn"
          data-action="staff.export"
          onClick={exportCsv}
          disabled={!shown.length}
          title={shown.length ? undefined : t('empty')}
        >
          <Download className="size-4" aria-hidden />
          {t('exportCsv')}
        </button>
      }
    >
      <div className="mb-3 flex flex-wrap gap-2.5">
        <label className="relative min-w-[200px] flex-1">
          <span className="sr-only">{t('search')}</span>
          <Search
            className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted"
            aria-hidden
          />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('search')}
            className="min-h-[44px] w-full rounded-[10px] border border-line bg-card2 ps-9 pe-3 text-[15px] outline-none focus:border-gold-text"
          />
        </label>
        <label>
          <span className="sr-only">{t('colStatus')}</span>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="min-h-[44px] rounded-[10px] border border-line bg-card2 px-3 text-[15px]"
          >
            <option value="">{t('allStatuses')}</option>
            {statuses.map((s) => (
              <option key={s} value={s}>
                {msg(locale, `access.status.${s}`)}
              </option>
            ))}
          </select>
        </label>
      </div>
      {rows.length === 0 ? (
        <p className="text-muted">{t('empty')}</p>
      ) : (
        <div className="mcards mgrid2 -mx-[var(--card-pad)] overflow-x-auto px-[var(--card-pad)]">
          <table className="w-full min-w-[680px] border-collapse text-[14px]">
            <thead>
              <tr className="border-b border-line text-start text-[12.5px] text-muted">
                {COLUMNS.map(([key, c]) => (
                  <th
                    key={key}
                    scope="col"
                    className="px-2 py-1 text-start font-bold"
                    aria-sort={sort?.key === key ? (sort.dir === 1 ? 'ascending' : 'descending') : undefined}
                  >
                    <button
                      type="button"
                      className="inline-flex min-h-[44px] min-w-[44px] items-center gap-1"
                      data-action="table.sort"
                      aria-label={t('sortBy', { column: t(c) })}
                      onClick={() => setSort((s) => ({ key, dir: s?.key === key && s.dir === 1 ? -1 : 1 }))}
                    >
                      {t(c)}
                      <ArrowUpDown className="size-3.5" aria-hidden />
                    </button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {shown.map((r) => (
                <tr key={`${r.kind}-${r.id}`} className="border-b border-line last:border-0 hover:bg-hover">
                  <td className="px-2 py-1">
                    <button
                      type="button"
                      className="min-h-[var(--tap)] min-w-[44px] text-start font-semibold text-em hover:underline"
                      data-action="staff.edit"
                      onClick={() => onOpen(r)}
                    >
                      {r.name}
                    </button>
                  </td>
                  <td className="px-2 py-1">{r.designation}</td>
                  <td className="px-2 py-1">L{r.seniority}</td>
                  <td className="px-2 py-1 break-all">{r.email}</td>
                  <td className="px-2 py-1 whitespace-nowrap" title={formatDate(locale, when(r))}>
                    {lastCell(r)}
                  </td>
                  <td className="px-2 py-1">
                    <span className={cn('badge', BADGE[r.status])}>{msg(locale, `access.status.${r.status}`)}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="mt-2 text-[13px] text-muted">
        {t('showing', { shown: String(shown.length), total: String(rows.length) })}
      </p>
    </Card>
  );
}

function Card({ title, action, children }: { title: string; action?: ReactNode; children: ReactNode }) {
  return (
    <section className="mb-[var(--gap)] rounded-[var(--card-radius)] border border-line bg-card p-[var(--card-pad)] sm:shadow-card">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-[length:var(--section-title)] font-bold">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

function Kpi({
  icon,
  tone,
  label,
  value,
  hint,
}: {
  icon: ReactNode;
  tone: string;
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="relative flex items-center gap-3 overflow-hidden rounded-[var(--card-radius)] border border-line bg-card p-[var(--card-pad)] before:absolute before:inset-y-0 before:start-0 before:w-[3px] before:bg-linear-to-b before:from-gold-600 before:to-teal-600 sm:gap-4 sm:shadow-card">
      <div
        className="grid size-[var(--tile-icon)] shrink-0 place-items-center rounded-[15px]"
        style={{ background: `${tone}1f`, color: tone }}
      >
        {icon}
      </div>
      <div className="min-w-0">
        <small className="block text-[13px] text-muted sm:text-[14px]">{label}</small>
        <b className="block truncate text-[20px] tracking-[-0.02em] sm:text-[26px]">{value}</b>
        <p className="truncate text-[12px] text-muted sm:text-[13px]">{hint}</p>
      </div>
    </div>
  );
}

function InviteDialog({
  locale,
  designations,
  onClose,
  onDone,
}: {
  locale: Locale;
  designations: { name: string; seniority: number }[];
  onClose: () => void;
  onDone: (r: ActionResult) => void;
}) {
  const t = (k: string) => msg(locale, `access.staff.${k}`);
  const [error, setError] = useState<ActionResult | null>(null);
  return (
    <Modal
      open
      onOpenChange={(o) => !o && onClose()}
      title={t('invite')}
      intro={t('inviteIntro')}
      closeLabel={msg(locale, 'common.close')}
    >
      <ActionForm action={inviteStaff} onDone={(r) => (r.ok ? onDone(r) : setError(r))} className="grid gap-[14px]">
        {(pending) => (
          <>
            <Hidden values={{ locale }} />
            <label className="form-field">
              {t('fullName')}
              <input name="name" required maxLength={120} autoComplete="off" />
            </label>
            <label className="form-field">
              {t('officialEmail')}
              <input
                name="email"
                type="email"
                required
                maxLength={254}
                autoComplete="off"
                placeholder="name@mcci.org.pk"
              />
            </label>
            <label className="form-field">
              {msg(locale, 'access.staff.colDesignation')}
              <select name="designation" defaultValue="Membership Officer">
                {designations.map((d) => (
                  <option key={d.name} value={d.name}>
                    {d.name} (L{d.seniority})
                  </option>
                ))}
              </select>
            </label>
            <label className="form-field">
              {t('note')}
              <textarea name="note" maxLength={1000} />
            </label>
            <FormMessage result={error} />
            <div className="flex flex-wrap justify-end gap-2.5">
              <button type="button" className="btn" onClick={onClose}>
                {t('cancel')}
              </button>
              <button className="btn btn-primary" data-action="staff.invite.send" disabled={pending}>
                <Mail className="size-4" aria-hidden />
                {pending ? t('working') : t('send')}
              </button>
            </div>
          </>
        )}
      </ActionForm>
    </Modal>
  );
}

function PersonDialog({
  locale,
  row,
  canManage,
  designations,
  onClose,
  onDone,
}: {
  locale: Locale;
  row: StaffRow;
  canManage: boolean;
  designations: { name: string; seniority: number }[];
  onClose: () => void;
  onDone: (r: ActionResult) => void;
}) {
  const t = (k: string, vars?: Record<string, string>) => msg(locale, `access.staff.${k}`, vars);
  const [error, setError] = useState<ActionResult | null>(null);
  const report = (r: ActionResult) => (r.ok ? onDone(r) : setError(r));
  const editable = canManage && row.kind === 'staff' && !row.self;
  const facts: [string, ReactNode][] = [
    [t('email'), row.email],
    [msg(locale, 'access.staff.colDesignation'), row.designation],
    [t('seniority'), `L${row.seniority}`],
    [
      t('status'),
      <span key="s" className={cn('badge', BADGE[row.status])}>
        {msg(locale, `access.status.${row.status}`)}
      </span>,
    ],
    ...(row.kind === 'staff'
      ? ([
          [t('twoStep'), row.totp ? t('twoStepOn') : t('twoStepOff')],
          [t('lastActive'), formatDate(locale, row.lastActive)],
        ] as [string, ReactNode][])
      : ([
          [
            t('invitation'),
            t('sentExpires', { sent: formatDate(locale, row.sentAt), expires: formatDate(locale, row.expiresAt) }),
          ],
        ] as [string, ReactNode][])),
  ];

  return (
    <Modal open onOpenChange={(o) => !o && onClose()} title={row.name} closeLabel={msg(locale, 'common.close')} wide>
      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-[14px]">
        {facts.map(([k, v]) => (
          <div key={k} className="contents">
            <dt className="text-muted">{k}</dt>
            <dd className="font-semibold break-all">{v}</dd>
          </div>
        ))}
      </dl>
      <p className="text-[13.5px] text-muted">{msg(locale, `access.designations.${row.designation}`)}</p>
      {row.self && <p className="text-[13.5px] text-muted">{t('yourself')}</p>}

      {editable && (
        <ActionForm action={updateStaff} onDone={report} className="grid gap-[14px] border-t border-line pt-4">
          {(pending) => (
            <>
              <Hidden values={{ locale, user: row.id }} />
              <div className="grid gap-[14px] sm:grid-cols-2">
                <label className="form-field">
                  {msg(locale, 'access.staff.colDesignation')}
                  <select name="designation" defaultValue={row.designation}>
                    {designations.map((d) => (
                      <option key={d.name} value={d.name}>
                        {d.name} (L{d.seniority})
                      </option>
                    ))}
                  </select>
                </label>
                <label className="form-field">
                  {t('status')}
                  <select name="status" defaultValue={row.status === 'Active' ? 'Active' : 'Disabled'}>
                    <option value="Active">{t('statusActive')}</option>
                    <option value="Disabled">{t('statusDisabled')}</option>
                  </select>
                </label>
              </div>
              <div className="flex justify-end">
                <button className="btn btn-primary" data-action="staff.edit.save" disabled={pending}>
                  {pending ? t('working') : t('save')}
                </button>
              </div>
            </>
          )}
        </ActionForm>
      )}

      <FormMessage result={error} />

      {canManage && (
        <div className="flex flex-wrap justify-end gap-2.5">
          {row.kind === 'invitation' ? (
            <>
              <ActionForm action={resendStaffInvite} onDone={report}>
                {(pending) => (
                  <>
                    <Hidden values={{ locale, id: row.id }} />
                    <button className="btn" data-action="staff.resend" disabled={pending}>
                      <Mail className="size-4" aria-hidden />
                      {t('resend')}
                    </button>
                  </>
                )}
              </ActionForm>
              {row.status === 'Invited' && (
                <ActionForm action={revokeStaffInvite} onDone={report}>
                  {(pending) => (
                    <>
                      <Hidden values={{ locale, id: row.id }} />
                      <button className="btn text-bad" data-action="staff.revoke" disabled={pending}>
                        {t('cancelInvite')}
                      </button>
                    </>
                  )}
                </ActionForm>
              )}
            </>
          ) : (
            !row.self &&
            row.totp && (
              <ActionForm action={resetStaffMfa} onDone={report}>
                {(pending) => (
                  <>
                    <Hidden values={{ locale, user: row.id }} />
                    <button className="btn" data-action="staff.reset2fa" disabled={pending}>
                      <RefreshCw className="size-4" aria-hidden />
                      {t('reset2fa')}
                    </button>
                  </>
                )}
              </ActionForm>
            )
          )}
        </div>
      )}
    </Modal>
  );
}

