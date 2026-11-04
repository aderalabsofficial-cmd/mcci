'use client';

import { Check, UserRoundCheck, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { ActionNotice } from '@/components/shared/action-notice';
import { Modal } from '@/components/shared/modal';
import type { Locale } from '@/i18n/routing';
import { decideClaim } from '@/lib/claims/actions';
import { callAction, type Outcome } from '@/lib/client/call-action';
import { msg } from '@/lib/nav/model';

export interface ClaimRow {
  id: string;
  person: string;
  email: string;
  mobile: string;
  cls: string;
  claimed: string;
  company: string;
  match: string | null;
}

const ROLES = ['Owner', 'Manager', 'Accounts', 'Services', 'Viewer'] as const;

/**
 * Existing members who signed up and asked to be linked to their membership (migration 0680; claim.approve,
 * claim.reject). The register's best match is chosen already; staff confirm it or pick the right member, and the role.
 */
export function ClaimsCard({
  locale,
  rows,
  members,
  canDecide,
}: {
  locale: Locale;
  rows: ClaimRow[];
  members: { id: string; label: string }[];
  canDecide: boolean;
}) {
  const t = (k: string, v?: Record<string, string>) => msg(locale, `claims.${k}`, v);
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [note, setNote] = useState<Outcome | null>(null);
  const [inner, setInner] = useState<Outcome | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [pick, setPick] = useState<Record<string, { member: string; role: string }>>({});
  const [reject, setReject] = useState<ClaimRow | null>(null);
  const [reason, setReason] = useState('');
  const choice = (r: ClaimRow) => pick[r.id] ?? { member: r.match ?? '', role: 'Owner' };

  const decide = async (r: ClaimRow, approve: boolean) => {
    setBusy(r.id);
    const c = choice(r);
    const out = await callAction(locale, () =>
      decideClaim(locale, { id: r.id, approve, member: c.member || null, role: c.role, note: approve ? '' : reason }),
    );
    setBusy(null);
    if (!out.ok) return approve ? setNote(out) : setInner(out);
    setReject(null);
    setNote(out);
    startTransition(() => router.refresh());
  };

  return (
    <section className="card" aria-labelledby="claims-h" style={{ marginBottom: 18 }} data-section="claims">
      <div className="ch">
        <h3 id="claims-h">
          <UserRoundCheck size={18} aria-hidden /> {t('title')}
        </h3>
        <span className={`bd ${rows.length ? 'orange' : 'green'}`}>{rows.length}</span>
      </div>
      <p className="muted" style={{ marginBottom: 12 }}>
        {t('help')}
      </p>
      <ActionNotice locale={locale} note={note} />
      {!rows.length && <p className="em">{t('none')}</p>}
      {rows.map((r) => {
        const c = choice(r);
        return (
          <div className="agenda" key={r.id} data-claim={r.email}>
            <div>
              <b>
                {r.person} · <span dir="ltr">{r.mobile || '—'}</span>
              </b>
              <small dir="ltr">{r.email}</small>
              <small>
                {t('asked', {
                  cls: msg(locale, `membership.classes.${r.cls}`),
                  what: [r.claimed, r.company].filter(Boolean).join(' · '),
                })}
              </small>
              <small>{r.match ? t('matched') : t('noMatch')}</small>
            </div>
            {canDecide && (
              <div className="pb" style={{ alignItems: 'end' }}>
                <label className="form-field" style={{ minWidth: 240 }}>
                  {t('member')}
                  <select
                    value={c.member}
                    data-field="claim-member"
                    onChange={(e) => setPick((p) => ({ ...p, [r.id]: { ...c, member: e.target.value } }))}
                  >
                    <option value="">{t('pickMember')}</option>
                    {members.map((x) => (
                      <option key={x.id} value={x.id}>
                        {x.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="form-field">
                  {t('role')}
                  <select
                    value={c.role}
                    data-field="claim-role"
                    onChange={(e) => setPick((p) => ({ ...p, [r.id]: { ...c, role: e.target.value } }))}
                  >
                    {ROLES.map((x) => (
                      <option key={x} value={x}>
                        {t(`roles.${x}`)}
                      </option>
                    ))}
                  </select>
                </label>
                <button
                  type="button"
                  className="btn btn-primary"
                  data-action="claim.approve"
                  disabled={busy === r.id || !c.member}
                  onClick={() => void decide(r, true)}
                >
                  <Check size={16} aria-hidden /> {t('approve')}
                </button>
                <button
                  type="button"
                  className="btn btn-danger"
                  data-action="claim.reject"
                  disabled={busy === r.id}
                  onClick={() => (setInner(null), setReason(''), setReject(r))}
                >
                  <X size={16} aria-hidden /> {t('reject')}
                </button>
              </div>
            )}
          </div>
        );
      })}
      <Modal
        open={Boolean(reject)}
        onOpenChange={(o) => !o && setReject(null)}
        title={reject ? t('rejectTitle', { name: reject.person }) : ''}
        intro={t('rejectHelp')}
        closeLabel={msg(locale, 'common.close')}
        footer={
          reject && (
            <>
              <button type="button" className="btn" data-action="modal.close" onClick={() => setReject(null)}>
                {msg(locale, 'committee.desk.cancel')}
              </button>
              <button
                type="button"
                className="btn btn-danger"
                data-action="claim.reject.confirm"
                disabled={busy === reject.id}
                onClick={() => void decide(reject, false)}
              >
                {t('reject')}
              </button>
            </>
          )
        }
      >
        <label className="form-field">
          {t('reason')}
          <textarea rows={3} maxLength={1000} value={reason} onChange={(e) => setReason(e.target.value)} />
        </label>
        {inner && !inner.ok && (
          <p role="alert" style={{ color: '#b91c1c', fontWeight: 700 }}>
            {inner.message}
          </p>
        )}
      </Modal>
    </section>
  );
}
