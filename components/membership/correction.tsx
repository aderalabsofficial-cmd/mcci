'use client';

import { Flag, Send } from 'lucide-react';
import { useState } from 'react';
import type { Locale } from '@/i18n/routing';
import { resubmitApplication } from '@/lib/membership/actions';
import { missingLabel } from '@/lib/flow/application';
import { msg } from '@/lib/nav/model';
import { DocSlots } from './doc-slots';
import type { WizardApp } from './wizard';

/**
 * Correction screen (prototype join, stage 'returned'; actions app.fix.upload, app.resubmit): the officer's note and
 * only the documents that were rejected; resubmitting returns the file to the Membership Desk (api.app_resubmit).
 */
export function Correction({ locale, app, note }: { locale: Locale; app: WizardApp; note: string | null }) {
  const m = (k: string) => msg(locale, `membership.wiz.returned.${k}`);
  const [msgState, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [missing, setMissing] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const hasRejected = app.docs.some((d) => d.status === 'rejected');
  return (
    <>
      <div className="ph">
        <div>
          <h1>
            <span className="bi">
              <span className="bi-en">{msg('en', 'membership.wiz.returned.title')}</span>
              <span className="bi-ur" lang="ur">
                {msg('ur', 'membership.wiz.returned.title')}
              </span>
            </span>
          </h1>
          <p>{app.token}</p>
        </div>
      </div>
      <div className="next red">
        <div className="next-i">
          <Flag size={34} color="#fff" aria-hidden />
        </div>
        <div className="next-b">
          <small>{m('fromDesk')}</small>
          <h2>{note || msg(locale, 'membership.next.returned.d')}</h2>
        </div>
      </div>
      <div className="card">
        <div className="ch">
          <h3>{m('fixThese')}</h3>
        </div>
        {msgState && (
          <div
            className={`banner ${msgState.ok ? 'green' : 'red'}`}
            role={msgState.ok ? 'status' : 'alert'}
            style={{ marginBottom: 12 }}
          >
            <span>
              {msgState.text}
              {missing.length ? ` ${missing.map((c) => missingLabel(c, locale)).join(' · ')}` : ''}
            </span>
          </div>
        )}
        {hasRejected ? (
          <DocSlots
            locale={locale}
            appId={app.id}
            requirements={app.requirements}
            docs={app.docs}
            photoUrl={app.photoUrl}
            editable
            onlyRejected
            onMessage={setMsg}
          />
        ) : (
          <p className="muted">{m('nothing')}</p>
        )}
        <div className="pb" style={{ marginTop: 14 }}>
          <button
            type="button"
            className="btn btn-gold btn-big"
            data-action="app.resubmit"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              const r = await resubmitApplication(locale, app.id);
              setBusy(false);
              if (r && !r.ok) {
                setMsg({ ok: false, text: r.message ?? '' });
                setMissing(r.missing ?? []);
              }
            }}
          >
            <Send size={18} aria-hidden /> {busy ? msg(locale, 'membership.wiz.working') : m('resubmit')}
          </button>
        </div>
      </div>
    </>
  );
}
