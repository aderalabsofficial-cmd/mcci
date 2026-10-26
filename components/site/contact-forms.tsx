'use client';

import { Send } from 'lucide-react';
import { type FormEvent, type InputHTMLAttributes, useState } from 'react';
import { ActionNotice } from '@/components/shared/action-notice';
import type { Locale } from '@/i18n/routing';
import { callAction, type Outcome } from '@/lib/client/call-action';
import { msg } from '@/lib/nav/model';
import { sendContact } from '@/lib/site/actions';

/**
 * contact.send (prototype site/contact): two tabs, the contact form and the complaint desk; each creates a ticket and
 * shows its number. The fields stay filled if sending fails.
 */
export function ContactForms({ locale }: { locale: Locale }) {
  const m = (k: string) => msg(locale, `site.contact.${k}`);
  const [tab, setTab] = useState<'contact' | 'complaint'>('contact');
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<Outcome | null>(null);
  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    fd.set('locale', locale);
    fd.set('kind', tab);
    setBusy(true);
    setNote(null);
    const r = await callAction(locale, () => sendContact(fd));
    setBusy(false);
    setNote(r);
    if (r.ok) form.reset();
  };
  const field = (name: string, label: string, props: InputHTMLAttributes<HTMLInputElement> = {}) => (
    <label className="form-field">
      {label}
      <input name={name} {...props} />
    </label>
  );
  return (
    <div className="card" data-contact={tab}>
      <div className="tabs" role="tablist" aria-label={m('touch')}>
        {(['contact', 'complaint'] as const).map((k) => (
          <button
            key={k}
            type="button"
            role="tab"
            aria-selected={tab === k}
            className={tab === k ? 'on' : ''}
            data-action="tab"
            onClick={() => (setTab(k), setNote(null))}
          >
            {m(k === 'contact' ? 'tabContact' : 'tabComplaint')}
          </button>
        ))}
      </div>
      <form className="grid gap-3" onSubmit={submit} role="tabpanel" key={tab}>
        <div className="grid gap-3 sm:grid-cols-2">
          {field('name', m('name'), { required: true, minLength: 2, maxLength: 120, autoComplete: 'name' })}
          {tab === 'contact' ? (
            <>
              {field('contact', m('contact'), { required: true, minLength: 5, maxLength: 160 })}
              {field('subject', m('subject'), { maxLength: 200 })}
              {field('ref', m('member'), { maxLength: 40 })}
            </>
          ) : (
            <>
              {field('contact', m('contact'), { required: true, minLength: 5, maxLength: 160 })}
              <label className="form-field">
                {m('about')}
                <select name="category" defaultValue="delay">
                  {(['delay', 'staff', 'document', 'other'] as const).map((c) => (
                    <option key={c} value={c}>
                      {m(`cats.${c}`)}
                    </option>
                  ))}
                </select>
              </label>
              {field('ref', m('token'), { maxLength: 40 })}
            </>
          )}
        </div>
        <label className="form-field">
          {tab === 'contact' ? m('message') : m('details')}
          <textarea name="body" rows={4} required minLength={5} maxLength={4000} />
        </label>
        {/* filled in only by bots (hidden from people and screen readers) */}
        <input name="website" tabIndex={-1} autoComplete="off" hidden />
        <ActionNotice locale={locale} note={note} />
        <div>
          <button type="submit" className="btn btn-primary" data-action="contact.send" disabled={busy}>
            <Send size={16} aria-hidden /> {tab === 'contact' ? m('send') : m('submit')}
          </button>
        </div>
      </form>
    </div>
  );
}
