'use client';

import { type FormEvent, useState } from 'react';
import { ActionNotice } from '@/components/shared/action-notice';
import type { Locale } from '@/i18n/routing';
import { callAction, type Outcome } from '@/lib/client/call-action';
import { msg } from '@/lib/nav/model';
import { sendContact } from '@/lib/site/actions';

/**
 * The home page's Complaints & Suggestions form, on contact.send: a complaint goes to the complaint desk and a
 * suggestion to the Secretariat as a message; both create a real ticket and show its number (docs/05 M2).
 */
export function ComplaintForm({ locale }: { locale: Locale }) {
  const m = (k: string) => msg(locale, `landing.${k}`);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<Outcome | null>(null);
  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    const complaint = fd.get('cstype') === 'complaint';
    fd.set('locale', locale);
    fd.set('kind', complaint ? 'complaint' : 'contact');
    fd.set(complaint ? 'category' : 'subject', complaint ? 'other' : msg('en', 'landing.cs_suggestion'));
    setBusy(true);
    setNote(null);
    const r = await callAction(locale, () => sendContact(fd));
    setBusy(false);
    setNote(r);
    if (r.ok) form.reset();
  };
  return (
    <form className="complaint" id="complaints" onSubmit={submit} data-contact="home">
      <h3>{m('cs_title')}</h3>
      <div className="cs-type" role="radiogroup" aria-label={m('cs_type')}>
        <label>
          <input type="radio" name="cstype" value="complaint" defaultChecked />
          <span>{m('cs_complaint')}</span>
        </label>
        <label>
          <input type="radio" name="cstype" value="suggestion" />
          <span>{m('cs_suggestion')}</span>
        </label>
      </div>
      <div className="cs-row">
        <label className="cs-f">
          <span>{m('cs_name')}</span>
          <input name="name" autoComplete="name" required minLength={2} maxLength={120} />
        </label>
        <label className="cs-f">
          <span>{m('cs_member')}</span>
          <input name="ref" autoComplete="off" maxLength={40} />
        </label>
      </div>
      <label className="cs-f">
        <span>{m('cs_contact')}</span>
        <input name="contact" autoComplete="off" required minLength={5} maxLength={160} />
      </label>
      <label className="cs-f">
        <span>{m('cs_msg')}</span>
        <textarea name="body" rows={4} required minLength={5} maxLength={4000} />
      </label>
      {/* filled in only by bots (hidden from people and screen readers) */}
      <input name="website" tabIndex={-1} autoComplete="off" hidden />
      <div className="cs-foot">
        <div className="proto" style={{ flexBasis: '100%' }} hidden={!note}>
          <ActionNotice locale={locale} note={note} />
        </div>
        <button className="btn btn-green" type="submit" data-action="contact.send" disabled={busy}>
          {m('cs_send')}
        </button>
      </div>
    </form>
  );
}
