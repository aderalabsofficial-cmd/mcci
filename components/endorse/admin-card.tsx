'use client';

import { Check, Clock, Mail, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import type { Locale } from '@/i18n/routing';
import { remindEndorser } from '@/lib/endorse/actions';
import { msg } from '@/lib/nav/model';
import type { SlotEndorsement } from './slots';

/** Proposer & seconder on the review desk (prototype M.endAdmin): status, dates, reference, remind. Never sign. */
export function EndorseAdminCard({
  locale,
  items,
  canRemind,
}: {
  locale: Locale;
  items: SlotEndorsement[];
  canRemind: boolean;
}) {
  const m = (k: string, v?: Record<string, string>) => msg(locale, `endorse.${k}`, v);
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [note, setNote] = useState<string | null>(null);
  const date = (iso: string) =>
    new Date(iso).toLocaleDateString(locale === 'ur' ? 'ur-PK' : 'en-GB', {
      timeZone: 'Asia/Karachi',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  const current = (role: string) =>
    items.find((e) => e.role === role && (e.status === 'Pending' || e.status === 'Approved')) ??
    items.find((e) => e.role === role) ??
    null;
  const pending = (['proposer', 'seconder'] as const)
    .map(current)
    .filter((x): x is SlotEndorsement => x?.status === 'Pending');

  return (
    <>
      {(['proposer', 'seconder'] as const).map((role) => {
        const x = current(role);
        const s = x?.status ?? 'Empty';
        return (
          <div className="drow" key={role}>
            <span>
              {s === 'Approved' ? (
                <Check size={16} color="#1fa34a" aria-hidden />
              ) : s === 'Pending' ? (
                <Clock size={16} color="#f59e0b" aria-hidden />
              ) : (
                <X size={16} color="#ef4444" aria-hidden />
              )}
            </span>
            <div>
              <b>
                {m(`roles.${role}`)}: {x?.rep ?? '—'}
              </b>
              <small>
                {x
                  ? `${x.company} · ${x.member_no} · ${m('admin.requested', { date: date(x.requested_at) })}`
                  : m('admin.none')}
                {x?.status === 'Approved' && x.decided_at
                  ? ` · ${m('admin.signedAt', { date: date(x.decided_at), ref: x.ref ?? '' })}`
                  : ''}
                {x?.status === 'Declined' ? ` · ${x.decline_reason ?? ''}` : ''}
              </small>
            </div>
            {x?.status === 'Approved' && x.signatureUrl && (
              // eslint-disable-next-line @next/next/no-img-element -- signed URL of a private file
              <img className="esmall" src={x.signatureUrl} alt="" />
            )}
            <span className={`bd ${s === 'Approved' ? 'green' : s === 'Pending' ? 'orange' : 'red'}`}>
              {m(`slots.status.${s}`)}
            </span>
          </div>
        );
      })}
      {canRemind && pending.length > 0 && (
        <div className="pb" style={{ marginTop: 8 }}>
          <button
            type="button"
            className="btn btn-w"
            data-action="adm.prop.remind"
            onClick={async () => {
              const results = await Promise.all(pending.map((p) => remindEndorser(locale, p.id)));
              setNote(results.map((r) => r.message).join(' '));
              startTransition(() => router.refresh());
            }}
          >
            <Mail size={16} aria-hidden /> {m('admin.remind')}
          </button>
        </div>
      )}
      {note && (
        <p role="status" className="muted" style={{ marginTop: 8 }}>
          {note}
        </p>
      )}
    </>
  );
}
