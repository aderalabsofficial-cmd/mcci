'use client';

import { BadgeCheck } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { ActionForm, Hidden } from '@/components/shared/action-form';
import { FormMessage } from '@/components/shared/modal';
import type { Locale } from '@/i18n/routing';
import type { ActionResult } from '@/lib/access/result';
import { msg } from '@/lib/nav/model';
import { confirmQuota } from '@/lib/whatsapp/actions';
import type { QuotaStatus } from '@/lib/whatsapp/load';

const QUALITY = ['UNKNOWN', 'HIGH', 'MEDIUM', 'LOW'] as const;

/**
 * An administrator records what WhatsApp Manager or Meta Support shows: tier, limit, verification and quality. The
 * system never raises the limit from its own counts; this form, with its source and a note, is the only way.
 */
export function QuotaForm({ locale, q }: { locale: Locale; q: QuotaStatus }) {
  const m = (k: string) => msg(locale, `wa.readiness.${k}`);
  const router = useRouter();
  const [notice, setNotice] = useState<ActionResult | null>(null);
  return (
    <ActionForm
      action={confirmQuota}
      onDone={(r) => {
        setNotice(r);
        if (r.ok) router.refresh();
      }}
      className="biz-form"
    >
      {(busy) => (
        <>
          <Hidden values={{ locale }} />
          <label className="form-field">
            {m('tier')}
            <input name="tier" defaultValue={q.tier ?? ''} maxLength={40} dir="ltr" data-field="quota-tier" required />
          </label>
          <label className="form-field">
            {m('limit')}
            <input name="limit" type="number" min={1} defaultValue={q.limit ?? ''} dir="ltr" data-field="quota-limit" required />
          </label>
          <label className="form-field">
            {m('verification')}
            <select name="verification" defaultValue={q.verification} data-field="quota-verification">
              {(['unknown', 'not_verified', 'pending', 'verified'] as const).map((v) => (
                <option key={v} value={v}>
                  {m(`verificationStates.${v}`)}
                </option>
              ))}
            </select>
          </label>
          <label className="form-field">
            {m('phoneQuality')}
            <select name="phoneQuality" defaultValue={q.phoneQuality} data-field="quota-phone-quality">
              {QUALITY.map((v) => (
                <option key={v} value={v}>
                  {m(`quality.${v}`)}
                </option>
              ))}
            </select>
          </label>
          <label className="form-field">
            {m('templateQuality')}
            <select name="templateQuality" defaultValue={q.templateQuality} data-field="quota-template-quality">
              {QUALITY.map((v) => (
                <option key={v} value={v}>
                  {m(`quality.${v}`)}
                </option>
              ))}
            </select>
          </label>
          <label className="form-field">
            {m('external')}
            <input name="external" type="number" min={0} defaultValue={q.external24} dir="ltr" data-field="quota-external" />
          </label>
          <label className="form-field">
            {m('staleDays')}
            <input name="staleDays" type="number" min={1} max={90} defaultValue={q.staleDays} dir="ltr" data-field="quota-stale-days" />
          </label>
          <label className="form-field">
            {m('source')}
            <select name="source" defaultValue={q.source === 'provider' ? 'admin' : q.source} data-field="quota-source">
              <option value="admin">{m('sources.admin')}</option>
              <option value="meta_support">{m('sources.meta_support')}</option>
            </select>
          </label>
          <label className="form-field biz-wide">
            {m('note')}
            <input name="note" maxLength={300} placeholder={m('notePlaceholder')} data-field="quota-note" required />
          </label>
          <div className="pb biz-wide">
            <button className="btn btn-primary" data-action="wa.quota.confirm" disabled={busy} title={busy ? msg(locale, 'wa.common.working') : undefined}>
              <BadgeCheck size={15} aria-hidden /> {m('confirm')}
            </button>
          </div>
          {notice && <FormMessage result={notice} />}
        </>
      )}
    </ActionForm>
  );
}
