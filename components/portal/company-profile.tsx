'use client';

import { Mail, Pencil, User } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { ActionForm, Hidden } from '@/components/shared/action-form';
import { Bi } from '@/components/shared/bi';
import { FormMessage, Modal } from '@/components/shared/modal';
import type { Locale } from '@/i18n/routing';
import type { ActionResult } from '@/lib/access/result';
import {
  inviteCompanyUser,
  removeCompanyUser,
  requestParticularChange,
  resendCompanyInvite,
  revokeCompanyInvite,
  setUrduFirst,
  updateCompanyUser,
} from '@/lib/company/actions';
import { PARTICULAR_FIELDS, type ParticularField } from '@/lib/company/fields';
import { formatDate } from '@/lib/format';
import { msg } from '@/lib/nav/model';
import { cn } from '@/lib/utils';

export interface Person {
  kind: 'user' | 'invitation';
  /** user id, or invitation id */
  id: string;
  name: string;
  email: string;
  role: 'Owner' | 'Manager' | 'Services' | 'Accounts' | 'Viewer';
  status: 'Active' | 'Invited' | 'Expired';
  sentAt: string | null;
  self: boolean;
}

const ROLES = ['Owner', 'Manager', 'Services', 'Accounts', 'Viewer'] as const;
const INVITE_ROLES = ROLES.filter((r) => r !== 'Owner');

export function CompanyProfile({
  locale,
  companyId,
  canManage,
  details,
  changes,
  people,
  partners,
  urduFirst,
}: {
  locale: Locale;
  companyId: string;
  canManage: boolean;
  details: Record<string, string | null>;
  changes: { id: string; field: string; value: string; status: string; at: string }[];
  people: Person[];
  partners: { id: string; name: string; mobile: string | null; card: boolean }[];
  urduFirst: boolean;
}) {
  const t = (k: string, vars?: Record<string, string>) => msg(locale, `access.company.${k}`, vars);
  const both = (path: string) => ({ en: msg('en', path), ur: msg('ur', path) });
  const [notice, setNotice] = useState<ActionResult | null>(null);
  const [changing, setChanging] = useState<ParticularField | null>(null);
  const [inviting, setInviting] = useState(false);
  const [open, setOpen] = useState<Person | null>(null);
  const done = (r: ActionResult) => {
    setNotice(r);
    if (r.ok) {
      setChanging(null);
      setInviting(false);
      setOpen(null);
    }
  };
  const pending = changes.filter((c) => c.status === 'Pending');
  const label = (f: string) => ((PARTICULAR_FIELDS as readonly string[]).includes(f) ? t(`fields.${f}`) : f);
  const show = (f: ParticularField) => (f === 'established' ? formatDate(locale, details[f]) : details[f] || '—');

  return (
    <>
      <p className="mb-3 text-muted">{t('subtitle')}</p>
      <div aria-live="polite" className="mb-3 empty:hidden">
        {notice && <FormMessage result={notice} />}
      </div>

      <div className="grid grid-cols-1 gap-[var(--gap)] lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <Card
          title={<Bi label={both('access.company.particulars')} locale={locale} />}
          badge={pending.length ? t('pending', { count: String(pending.length) }) : null}
        >
          <dl className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {PARTICULAR_FIELDS.map((f) => (
              <div key={f} className="rounded-[12px] border border-line bg-card2 py-2 ps-3 pe-1">
                <dt className="text-[12px] text-muted">{t(`fields.${f}`)}</dt>
                <dd className="flex items-center justify-between gap-2">
                  <span className="min-w-0 font-semibold break-words">{show(f)}</span>
                  {canManage && (
                    <button
                      type="button"
                      className="-my-2 grid size-[var(--tap)] shrink-0 place-items-center rounded-[10px] text-muted hover:bg-hover"
                      data-action="profile.change"
                      aria-label={t('requestChange', { field: t(`fields.${f}`) })}
                      title={t('requestChange', { field: t(`fields.${f}`) })}
                      onClick={() => setChanging(f)}
                    >
                      <Pencil className="size-4" aria-hidden />
                    </button>
                  )}
                </dd>
              </div>
            ))}
          </dl>
          {changes.length > 0 && (
            <>
              <h3 className="mt-4 mb-2 font-bold">{t('changesTitle')}</h3>
              <ul className="grid grid-cols-1 gap-1.5 text-[14px]">
                {changes.map((c) => (
                  <li
                    key={c.id}
                    className="flex flex-wrap items-center justify-between gap-2 border-b border-line pb-1.5 last:border-0"
                  >
                    <span>
                      <b>{label(c.field)}</b> → {c.value}
                      <small className="ms-2 text-muted">{formatDate(locale, c.at)}</small>
                    </span>
                    <span
                      className={cn(
                        'badge',
                        c.status === 'Approved'
                          ? 'badge-green'
                          : c.status === 'Rejected'
                            ? 'badge-red'
                            : 'badge-orange',
                      )}
                    >
                      {msg(
                        locale,
                        `access.status.${c.status === 'Pending' ? 'Pending' : c.status === 'Approved' ? 'Active' : 'Revoked'}`,
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </Card>

        <Card title={<Bi label={both('access.company.partners')} locale={locale} />}>
          {partners.length === 0 ? (
            <p className="text-muted">{t('nothingYet')}</p>
          ) : (
            <ul className="grid grid-cols-1 gap-1">
              {partners.map((p) => (
                <li key={p.id} className="flex items-center gap-3 px-2 py-2">
                  <span className="grid size-10 shrink-0 place-items-center rounded-[12px] bg-teal-600 text-white">
                    <User className="size-5" aria-hidden />
                  </span>
                  <span className="min-w-0 flex-1">
                    <b className="block truncate">{p.name}</b>
                    <small className="block truncate text-muted">{p.mobile ?? '—'}</small>
                  </span>
                  {p.card && <span className="badge badge-gold">{t('card')}</span>}
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <div className="mt-[var(--gap)] grid grid-cols-1 gap-[var(--gap)] lg:grid-cols-2">
        <div className="contents">
          <Card
            title={<Bi label={both('access.company.people')} locale={locale} />}
            action={
              canManage ? (
                <button
                  type="button"
                  className="btn btn-primary"
                  data-action="user.invite"
                  onClick={() => setInviting(true)}
                >
                  <Mail className="size-4" aria-hidden />
                  {t('inviteByEmail')}
                </button>
              ) : null
            }
          >
            <ul className="grid grid-cols-1 gap-1">
              {people.map((p) => {
                const managed = canManage && p.role !== 'Owner' && !p.self;
                const sub = `${msg(locale, `access.roleNames.${p.role}`)} · ${p.email}${
                  p.kind === 'invitation' ? ` · ${t('invitedOn', { date: formatDate(locale, p.sentAt) })}` : ''
                }`;
                const inner = (
                  <>
                    <span
                      className={cn(
                        'grid size-10 shrink-0 place-items-center rounded-[12px] text-white',
                        p.role === 'Owner' ? 'bg-gold-600' : 'bg-navy-600',
                      )}
                    >
                      <User className="size-5" aria-hidden />
                    </span>
                    <span className="min-w-0 flex-1 text-start">
                      <b className="block truncate">
                        {p.name} {p.self && <span className="font-normal text-muted">{t('you')}</span>}
                      </b>
                      <small className="block truncate text-muted">{sub}</small>
                    </span>
                    <span
                      className={cn(
                        'badge',
                        p.role === 'Owner'
                          ? 'badge-gold'
                          : p.status === 'Active'
                            ? 'badge-green'
                            : p.status === 'Invited'
                              ? 'badge-orange'
                              : 'badge-red',
                      )}
                    >
                      {msg(locale, `access.status.${p.role === 'Owner' ? 'Owner' : p.status}`)}
                    </span>
                  </>
                );
                return (
                  <li key={`${p.kind}-${p.id}`}>
                    {managed ? (
                      <button
                        type="button"
                        className="flex min-h-[var(--tap)] w-full items-center gap-3 rounded-[12px] px-2 py-2 hover:bg-hover"
                        data-action="user.edit"
                        onClick={() => setOpen(p)}
                      >
                        {inner}
                      </button>
                    ) : (
                      <div className="flex items-center gap-3 px-2 py-2">{inner}</div>
                    )}
                  </li>
                );
              })}
            </ul>
            {!canManage && <p className="mt-2 text-[13.5px] text-muted">{t('ownerOnly')}</p>}
            <ul className="mt-3 grid grid-cols-1 gap-1 border-t border-line pt-3 text-[12.5px] text-muted">
              {ROLES.map((r) => (
                <li key={r}>
                  <b className="text-ink">{msg(locale, `access.roleNames.${r}`)}</b> {msg(locale, `access.roles.${r}`)}
                </li>
              ))}
            </ul>
          </Card>

          <Card title={<Bi label={both('access.company.preferences')} locale={locale} />}>
            <ActionForm action={setUrduFirst} onDone={setNotice} className="flex items-center justify-between gap-3">
              {(busy) => (
                <>
                  <Hidden values={{ locale, ...(urduFirst ? {} : { urdu: 'on' }) }} />
                  <span>
                    <b className="block">{t('urduFirst')}</b>
                    <small className="text-muted">{t('urduFirstHelp')}</small>
                  </span>
                  <button
                    role="switch"
                    aria-checked={urduFirst}
                    aria-label={t('urduFirst')}
                    className="flex h-11 w-12 shrink-0 items-center"
                    data-action="setting.toggle"
                    disabled={busy}
                  >
                    <span
                      className={cn(
                        'relative block h-7 w-12 rounded-full border border-line transition-colors',
                        urduFirst ? 'bg-ok' : 'bg-card2',
                      )}
                    >
                      <span
                        className={cn(
                          'absolute top-0.5 size-[22px] rounded-full bg-white shadow transition-[inset-inline-start]',
                          urduFirst ? 'start-[22px]' : 'start-0.5',
                        )}
                      />
                    </span>
                  </button>
                </>
              )}
            </ActionForm>
          </Card>
        </div>
      </div>

      {changing && (
        <Modal
          open
          onOpenChange={(o) => !o && setChanging(null)}
          title={t('changeTitle')}
          intro={t('changeIntro')}
          closeLabel={msg(locale, 'common.close')}
        >
          <DialogForm
            action={requestParticularChange}
            onDone={done}
            values={{ locale, company: companyId, field: changing }}
          >
            {(busy, error) => (
              <>
                <p className="text-[14px]">
                  <span className="text-muted">{t('current')}: </span>
                  <b>{t(`fields.${changing}`)}</b> — {show(changing)}
                </p>
                <label className="form-field">
                  {t('newValue')}
                  <input
                    name="value"
                    required
                    maxLength={500}
                    type={changing === 'established' ? 'date' : changing === 'email' ? 'email' : 'text'}
                  />
                </label>
                <label className="form-field">
                  {t('reason')}
                  <textarea name="reason" maxLength={500} />
                </label>
                <FormMessage result={error} />
                <Footer cancel={t('cancel')} onCancel={() => setChanging(null)}>
                  <button className="btn btn-primary" data-action="profile.change.send" disabled={busy}>
                    {busy ? t('working') : t('sendChange')}
                  </button>
                </Footer>
              </>
            )}
          </DialogForm>
        </Modal>
      )}

      {inviting && (
        <Modal
          open
          onOpenChange={(o) => !o && setInviting(false)}
          title={t('inviteTitle')}
          intro={t('inviteIntro')}
          closeLabel={msg(locale, 'common.close')}
        >
          <DialogForm action={inviteCompanyUser} onDone={done} values={{ locale, company: companyId }}>
            {(busy, error) => (
              <>
                <label className="form-field">
                  {t('name')}
                  <input name="name" required maxLength={120} autoComplete="off" />
                </label>
                <label className="form-field">
                  {t('email')}
                  <input name="email" type="email" required maxLength={254} autoComplete="off" />
                </label>
                <RoleSelect locale={locale} defaultValue="Viewer" />
                <FormMessage result={error} />
                <Footer cancel={t('cancel')} onCancel={() => setInviting(false)}>
                  <button className="btn btn-primary" data-action="user.invite.send" disabled={busy}>
                    <Mail className="size-4" aria-hidden />
                    {busy ? t('working') : t('send')}
                  </button>
                </Footer>
              </>
            )}
          </DialogForm>
        </Modal>
      )}

      {open && (
        <PersonDialog locale={locale} companyId={companyId} person={open} onClose={() => setOpen(null)} onDone={done} />
      )}
    </>
  );
}

function Card({
  title,
  badge,
  action,
  children,
}: {
  title: ReactNode;
  badge?: string | null;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="rounded-[var(--card-radius)] border border-line bg-card p-[var(--card-pad)] sm:shadow-card">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-[length:var(--section-title)] font-bold">{title}</h2>
        {badge && <span className="badge badge-orange">{badge}</span>}
        {action}
      </div>
      {children}
    </section>
  );
}

function Footer({ cancel, onCancel, children }: { cancel: string; onCancel: () => void; children: ReactNode }) {
  return (
    <div className="flex flex-wrap justify-end gap-2.5">
      <button type="button" className="btn" onClick={onCancel}>
        {cancel}
      </button>
      {children}
    </div>
  );
}

function RoleSelect({ locale, defaultValue }: { locale: Locale; defaultValue: string }) {
  return (
    <label className="form-field">
      {msg(locale, 'access.company.role')}
      <select name="role" defaultValue={defaultValue}>
        {INVITE_ROLES.map((r) => (
          <option key={r} value={r}>
            {msg(locale, `access.roleNames.${r}`)} — {msg(locale, `access.roles.${r}`)}
          </option>
        ))}
      </select>
    </label>
  );
}

/** A dialog form: keeps its own error, passes success up (which closes the dialog). */
function DialogForm({
  action,
  onDone,
  values,
  children,
}: {
  action: Parameters<typeof ActionForm>[0]['action'];
  onDone: (r: ActionResult) => void;
  values: Record<string, string>;
  children: (busy: boolean, error: ActionResult | null) => ReactNode;
}) {
  const [error, setError] = useState<ActionResult | null>(null);
  return (
    <ActionForm
      action={action}
      onDone={(r) => (r.ok ? onDone(r) : setError(r))}
      className="grid grid-cols-1 gap-[14px]"
    >
      {(busy) => (
        <>
          <Hidden values={values} />
          {children(busy, error)}
        </>
      )}
    </ActionForm>
  );
}

function PersonDialog({
  locale,
  companyId,
  person,
  onClose,
  onDone,
}: {
  locale: Locale;
  companyId: string;
  person: Person;
  onClose: () => void;
  onDone: (r: ActionResult) => void;
}) {
  const t = (k: string) => msg(locale, `access.company.${k}`);
  const [error, setError] = useState<ActionResult | null>(null);
  const report = (r: ActionResult) => (r.ok ? onDone(r) : setError(r));
  const base = { locale, company: companyId };
  return (
    <Modal open onOpenChange={(o) => !o && onClose()} title={person.name} closeLabel={msg(locale, 'common.close')}>
      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-[14px]">
        <dt className="text-muted">{t('email')}</dt>
        <dd className="font-semibold break-all">{person.email}</dd>
        <dt className="text-muted">{t('role')}</dt>
        <dd className="font-semibold">{msg(locale, `access.roleNames.${person.role}`)}</dd>
        <dt className="text-muted">{t('status')}</dt>
        <dd className="font-semibold">{msg(locale, `access.status.${person.status}`)}</dd>
        <dt className="text-muted">{t('canDo')}</dt>
        <dd>{msg(locale, `access.roles.${person.role}`)}</dd>
      </dl>
      {person.kind === 'user' && (
        <ActionForm action={updateCompanyUser} onDone={report} className="grid gap-[14px] border-t border-line pt-4">
          {(busy) => (
            <>
              <Hidden values={{ ...base, user: person.id }} />
              <RoleSelect locale={locale} defaultValue={person.role} />
              <div className="flex justify-end">
                <button className="btn btn-primary" data-action="user.edit.save" disabled={busy}>
                  {busy ? t('working') : t('save')}
                </button>
              </div>
            </>
          )}
        </ActionForm>
      )}
      <FormMessage result={error} />
      <div className="flex flex-wrap justify-end gap-2.5">
        {person.kind === 'invitation' ? (
          <>
            <ActionForm action={resendCompanyInvite} onDone={report}>
              {(busy) => (
                <>
                  <Hidden values={{ ...base, id: person.id }} />
                  <button className="btn" data-action="user.resend" disabled={busy}>
                    <Mail className="size-4" aria-hidden />
                    {t('resend')}
                  </button>
                </>
              )}
            </ActionForm>
            {person.status === 'Invited' && (
              <ActionForm action={revokeCompanyInvite} onDone={report}>
                {(busy) => (
                  <>
                    <Hidden values={{ ...base, id: person.id }} />
                    <button className="btn text-bad" data-action="user.remove" disabled={busy}>
                      {t('cancelInvite')}
                    </button>
                  </>
                )}
              </ActionForm>
            )}
          </>
        ) : (
          <ActionForm action={removeCompanyUser} onDone={report}>
            {(busy) => (
              <>
                <Hidden values={{ ...base, user: person.id }} />
                <button className="btn text-bad" data-action="user.remove" disabled={busy}>
                  {t('remove')}
                </button>
              </>
            )}
          </ActionForm>
        )}
      </div>
    </Modal>
  );
}
