'use client';

import { Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { Modal } from '@/components/shared/modal';
import type { Locale } from '@/i18n/routing';
import { addMember } from '@/lib/members/actions';
import { SECTORS } from '@/lib/membership/reference';
import { msg } from '@/lib/nav/model';

/** "Add member" (action mem.add): an existing MCCI member and its owner's invitation */
export function AddMember({ locale, validTo }: { locale: Locale; validTo: string }) {
  const m = (k: string) => msg(locale, `register.${k}`);
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<{ ok: boolean; message: string } | null>(null);
  return (
    <>
      <button type="button" className="btn btn-primary" data-action="mem.add" onClick={() => (setNote(null), setOpen(true))}>
        <Plus size={16} aria-hidden /> {m('add')}
      </button>
      {note?.ok && (
        <div className="banner green" role="status" style={{ marginTop: 12 }}>
          <span>{note.message}</span>
        </div>
      )}
      <Modal open={open} onOpenChange={setOpen} title={m('addTitle')} intro={m('addHelp')} closeLabel={msg(locale, 'common.close')} wide>
        <form
          className="grid gap-3"
          onSubmit={async (e) => {
            // a submit handler, not a form action: React would clear the fields when the server refuses
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            setBusy(true);
            fd.set('locale', locale);
            const r = await addMember(fd);
            setBusy(false);
            setNote(r);
            if (r.ok) {
              setOpen(false);
              startTransition(() => router.refresh());
            }
          }}
        >
          <label className="form-field">
            {m('company')}
            <input name="company" required minLength={2} maxLength={200} />
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="form-field">
              {m('biz')}
              <select name="biz" defaultValue="prop">
                {(['prop', 'aop', 'pvt', 'mnc', 'public'] as const).map((b) => (
                  <option key={b} value={b}>
                    {msg(locale, `membership.biz.${b}.name`)}
                  </option>
                ))}
              </select>
            </label>
            <label className="form-field">
              {m('cls')}
              <select name="cls" defaultValue="Associate">
                <option value="Corporate">{msg(locale, 'membership.classes.Corporate')}</option>
                <option value="Associate">{msg(locale, 'membership.classes.Associate')}</option>
              </select>
            </label>
            <label className="form-field">
              {m('memberNo')}
              <input name="memberNo" placeholder="MCCI-C-1134" pattern="MCCI-[CAca]-\d{3,6}" />
            </label>
            <label className="form-field">
              {m('sector')}
              <select name="sector" defaultValue="">
                <option value="">—</option>
                {SECTORS.map((s) => (
                  <option key={s.k} value={s.k}>
                    {msg(locale, `membership.nature.${s.k}.name`)}
                  </option>
                ))}
              </select>
            </label>
            <label className="form-field">
              {m('rep')}
              <input name="rep" required minLength={2} maxLength={120} />
            </label>
            <label className="form-field">
              {m('since')}
              <input name="since" type="date" />
            </label>
            <label className="form-field">
              {m('validTo')}
              <input name="validTo" type="date" required defaultValue={validTo} />
            </label>
            <label className="form-field" style={{ alignSelf: 'end' }}>
              <span>
                <input name="women" type="checkbox" /> {m('women')}
              </span>
            </label>
            <label className="form-field">
              {m('owner')}
              <input name="owner" required minLength={2} maxLength={120} />
            </label>
            <label className="form-field">
              {m('email')}
              <input name="email" type="email" required maxLength={254} />
            </label>
          </div>
          {note && !note.ok && (
            <p role="alert" style={{ color: '#b91c1c', fontWeight: 700 }}>
              {note.message}
            </p>
          )}
          <div className="flex flex-wrap justify-end gap-2.5">
            <button type="button" className="btn" data-action="modal.close" onClick={() => setOpen(false)}>
              {m('cancel')}
            </button>
            <button type="submit" className="btn btn-primary" data-action="mem.add.confirm" disabled={busy}>
              {busy ? msg(locale, 'membership.wiz.working') : m('save')}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}
