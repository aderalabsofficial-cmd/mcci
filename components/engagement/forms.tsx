'use client';

import { Bell, Check, Mail, Pencil, Plus, Send } from 'lucide-react';
import { type ReactNode, useState, useTransition } from 'react';
import { ActionNotice } from '@/components/shared/action-notice';
import { Modal } from '@/components/shared/modal';
import { useRouter } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';
import { callAction, type Outcome } from '@/lib/client/call-action';
import {
  assignTicket,
  newTicket,
  readAllNotes,
  readNote,
  registerEvent,
  replyTicket,
  resolveTicket,
  saveEvent,
  savePost,
  sendTestEmail,
} from '@/lib/engagement/actions';
import { msg } from '@/lib/nav/model';

function useAction(locale: Locale) {
  const router = useRouter();
  const [refreshing, startTransition] = useTransition();
  const [busy, setBusy] = useState<string | null>(null);
  const [note, setNote] = useState<Outcome | null>(null);
  const run = async (key: string, fn: () => Promise<Outcome>) => {
    if (busy) return null;
    setBusy(key);
    setNote(null);
    const r = await callAction(locale, fn);
    setBusy(null);
    setNote(r);
    if (r.ok) startTransition(() => router.refresh());
    return r;
  };
  return { busy, locked: busy !== null || refreshing, note, setNote, run };
}

// ───────── messages ─────────

export interface NoteRow {
  id: string;
  title: string;
  body: string;
  when: string;
  read: boolean;
  link: string | null;
}

/** note.open / note.readall: the person's messages, opened in a dialog (marks read) */
export function NotesList({ locale, rows }: { locale: Locale; rows: NoteRow[] }) {
  const m = (k: string, v?: Record<string, string>) => msg(locale, `eng.notes.${k}`, v);
  const a = useAction(locale);
  const [open, setOpen] = useState<NoteRow | null>(null);
  const [seen, setSeen] = useState<string[]>([]);
  return (
    <>
      <div className="pb" style={{ marginBottom: 10 }}>
        <button
          type="button"
          className="btn btn-primary"
          data-action="note.readall"
          disabled={a.locked || rows.every((r) => r.read)}
          title={rows.every((r) => r.read) ? m('allRead') : undefined}
          onClick={() => void a.run('all', () => readAllNotes(locale))}
        >
          <Check size={16} aria-hidden /> {m('readAll')}
        </button>
      </div>
      <ActionNotice locale={locale} note={a.note} />
      {rows.length ? (
        rows.map((n) => {
          const read = n.read || seen.includes(n.id);
          return (
            <button
              type="button"
              key={n.id}
              className="li"
              style={{
                width: '100%',
                textAlign: 'start',
                background: 'none',
                border: 0,
                font: 'inherit',
                color: 'inherit',
              }}
              data-action="note.open"
              data-note={n.id}
              data-read={read || undefined}
              aria-label={m('open', { title: n.title })}
              onClick={() => {
                setOpen(n);
                if (!read) {
                  setSeen((x) => [...x, n.id]);
                  void callAction(locale, () => readNote(locale, n.id));
                }
              }}
            >
              <i style={{ background: read ? '#3b82f622' : '#c8963e22' }} aria-hidden>
                {read ? <Mail size={18} color="#3b82f6" /> : <Bell size={18} color="#c8963e" />}
              </i>
              <div style={{ flex: 1 }}>
                <b>{n.title}</b>
                <small>
                  {m('channel')} · {n.when}
                </small>
              </div>
              {!read && <span className="bd orange">{m('new')}</span>}
            </button>
          );
        })
      ) : (
        <p className="em">{m('none')}</p>
      )}
      <Modal
        open={open !== null}
        onOpenChange={(o) => !o && setOpen(null)}
        title={open?.title ?? ''}
        closeLabel={msg(locale, 'common.close')}
      >
        <p style={{ whiteSpace: 'pre-wrap' }}>{open?.body}</p>
        <p className="muted">{open?.when}</p>
        {open?.link && (
          <div className="flex justify-end">
            <a
              className="btn btn-primary"
              href={open.link.startsWith('/') ? `${locale === 'ur' ? '/ur' : ''}${open.link}` : open.link}
              data-action="nav"
            >
              {m('goTo')}
            </a>
          </div>
        )}
      </Modal>
    </>
  );
}

// ───────── events ─────────

/** event.reg: one tap for the company; the outcome stays under the button */
export function RegisterEvent({
  locale,
  eventId,
  companyId,
  title,
  state,
}: {
  locale: Locale;
  eventId: string;
  companyId: string;
  title: string;
  state: 'open' | 'registered' | 'full';
}) {
  const m = (k: string, v?: Record<string, string>) => msg(locale, `eng.events.${k}`, v);
  const a = useAction(locale);
  const [done, setDone] = useState(false);
  if (state === 'registered' || done) return <span className="bd green">{m('registered')}</span>;
  if (state === 'full') return <span className="bd gray">{m('full')}</span>;
  return (
    <span className="flex flex-col items-end gap-1">
      <button
        type="button"
        className="btn btn-primary btn-w"
        data-action="event.reg"
        aria-label={m('registerFor', { title })}
        disabled={a.locked}
        onClick={async () => {
          const r = await a.run('reg', () => registerEvent(locale, eventId, companyId));
          if (r?.ok) setDone(true);
        }}
      >
        {m('register')}
      </button>
      <ActionNotice locale={locale} note={a.note} />
    </span>
  );
}

export interface EventEdit {
  id?: string;
  title: string;
  title_ur: string;
  type: string;
  starts_at: string; // yyyy-mm-ddThh:mm in Pakistan time
  venue: string;
  seats: string;
  body: string;
  body_ur: string;
  published: boolean;
}

/** ev.create / ev.edit */
export function EventForm({ locale, event }: { locale: Locale; event?: EventEdit }) {
  const m = (k: string, v?: Record<string, string>) => msg(locale, `eng.events.${k}`, v);
  const a = useAction(locale);
  const [open, setOpen] = useState(false);
  const [inner, setInner] = useState<Outcome | null>(null);
  const e = event;
  return (
    <>
      {e ? (
        <button
          type="button"
          className="btn btn-w"
          data-action="ev.edit"
          aria-label={m('edit', { title: e.title })}
          onClick={() => (setInner(null), setOpen(true))}
        >
          <Pencil size={16} aria-hidden />
        </button>
      ) : (
        <button
          type="button"
          className="btn btn-primary"
          data-action="ev.create"
          onClick={() => (setInner(null), setOpen(true))}
        >
          <Plus size={16} aria-hidden /> {m('create')}
        </button>
      )}
      {!e && <ActionNotice locale={locale} note={a.note} />}
      <Modal
        open={open}
        onOpenChange={(o) => !o && !a.busy && setOpen(false)}
        title={e ? m('edit', { title: e.title }) : m('create')}
        closeLabel={msg(locale, 'common.close')}
        wide
      >
        <form
          className="grid gap-3"
          onSubmit={async (ev) => {
            ev.preventDefault();
            const fd = new FormData(ev.currentTarget);
            fd.set('locale', locale);
            if (e?.id) fd.set('id', e.id);
            setInner(null);
            const r = await a.run('save', () => saveEvent(fd));
            if (r?.ok) setOpen(false);
            else if (r) setInner(r);
          }}
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="form-field">
              {m('form.title')}
              <input name="title" required minLength={3} maxLength={200} defaultValue={e?.title} />
            </label>
            <label className="form-field">
              {m('form.titleUr')}
              <input name="title_ur" maxLength={200} defaultValue={e?.title_ur} dir="rtl" lang="ur" />
            </label>
            <label className="form-field">
              {m('form.type')}
              <input name="type" maxLength={60} defaultValue={e?.type} />
            </label>
            <label className="form-field">
              {m('form.startsAt')}
              <input name="starts_at" type="datetime-local" required defaultValue={e?.starts_at} />
            </label>
            <label className="form-field">
              {m('form.venue')}
              <input name="venue" maxLength={200} defaultValue={e?.venue} />
            </label>
            <label className="form-field">
              {m('form.seats')}
              <input name="seats" type="number" min={1} max={100000} defaultValue={e?.seats} />
            </label>
          </div>
          <label className="form-field">
            {m('form.body')}
            <textarea name="body" rows={3} maxLength={8000} defaultValue={e?.body} />
          </label>
          <label className="form-field">
            {m('form.bodyUr')}
            <textarea name="body_ur" rows={3} maxLength={8000} defaultValue={e?.body_ur} dir="rtl" lang="ur" />
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" name="published" defaultChecked={e?.published ?? true} /> {m('form.published')}
          </label>
          <ActionNotice locale={locale} note={inner} />
          <div className="flex justify-end">
            <button type="submit" className="btn btn-primary" data-action="ev.save" disabled={a.locked}>
              {m('form.save')}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}

// ───────── tickets ─────────

/** ticket.new from Help & Support */
/**
 * ticket.new: the "Raise a ticket" tile (its content comes from the server page as children: a server component cannot
 * hand a render function to a client component) and the dialog it opens.
 */
export function NewTicket({
  locale,
  companyId,
  children,
}: {
  locale: Locale;
  companyId: string | null;
  children: ReactNode;
}) {
  const m = (k: string) => msg(locale, `eng.support.${k}`);
  const a = useAction(locale);
  const [open, setOpen] = useState(false);
  const [inner, setInner] = useState<Outcome | null>(null);
  return (
    <>
      <button
        type="button"
        className="bt"
        data-action="ticket.new"
        onClick={() => {
          setInner(null);
          setOpen(true);
        }}
      >
        {children}
      </button>
      {a.note && <ActionNotice locale={locale} note={a.note} className="col-span-full" />}
      <Modal
        open={open}
        onOpenChange={(o) => !o && !a.busy && setOpen(false)}
        title={m('newTitle')}
        intro={m('newHelp')}
        closeLabel={msg(locale, 'common.close')}
      >
        <form
          className="grid gap-3"
          onSubmit={async (e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            fd.set('locale', locale);
            if (companyId) fd.set('company', companyId);
            setInner(null);
            const r = await a.run('new', () => newTicket(fd));
            if (r?.ok) setOpen(false);
            else if (r) setInner(r);
          }}
        >
          <label className="form-field">
            {m('subject')}
            <input name="subject" required minLength={3} maxLength={200} />
          </label>
          <label className="form-field">
            {m('message')}
            <textarea name="body" rows={4} required minLength={5} maxLength={4000} />
          </label>
          <ActionNotice locale={locale} note={inner} />
          <div className="flex justify-end">
            <button type="submit" className="btn btn-primary" data-action="ticket.new.send" disabled={a.locked}>
              <Send size={16} aria-hidden /> {m('send')}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}

/** ticket.reply: one box under the conversation (requester and staff) */
export function TicketReply({ locale, ticket }: { locale: Locale; ticket: string }) {
  const m = (k: string) => msg(locale, `eng.support.${k}`);
  const a = useAction(locale);
  return (
    <form
      className="grid gap-2"
      style={{ marginTop: 12 }}
      onSubmit={async (e) => {
        e.preventDefault();
        const form = e.currentTarget;
        const body = String(new FormData(form).get('body') ?? '');
        const r = await a.run('reply', () => replyTicket(locale, ticket, body));
        if (r?.ok) form.reset();
      }}
    >
      <label className="form-field">
        {m('replyLabel')}
        <textarea name="body" rows={3} required maxLength={4000} />
      </label>
      <ActionNotice locale={locale} note={a.note} />
      <div className="flex justify-end">
        <button type="submit" className="btn btn-primary" data-action="ticket.reply" disabled={a.locked}>
          <Send size={16} aria-hidden /> {m('reply')}
        </button>
      </div>
    </form>
  );
}

/** tk.assign / tk.resolve on the Complaint Desk */
export function TicketStaff({
  locale,
  ticket,
  staff,
  assigned,
  open,
}: {
  locale: Locale;
  ticket: string;
  staff: { id: string; name: string }[];
  assigned: string | null;
  open: boolean;
}) {
  const m = (k: string) => msg(locale, `eng.tk.${k}`);
  const a = useAction(locale);
  const [dlg, setDlg] = useState(false);
  const [inner, setInner] = useState<Outcome | null>(null);
  return (
    <>
      <div className="flex flex-wrap items-end gap-2.5">
        <label className="form-field">
          {m('assignTo')}
          <select
            defaultValue={assigned ?? ''}
            data-action="tk.assign"
            disabled={a.locked || !open}
            onChange={(e) => {
              const v = e.currentTarget.value;
              if (v) void a.run('assign', () => assignTicket(locale, ticket, v));
            }}
          >
            <option value="">{m('unassigned')}</option>
            {staff.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </label>
        {open && (
          <button
            type="button"
            className="btn btn-gold"
            data-action="tk.resolve"
            disabled={a.locked}
            onClick={() => (setInner(null), setDlg(true))}
          >
            <Check size={16} aria-hidden /> {m('resolve')}
          </button>
        )}
      </div>
      <ActionNotice locale={locale} note={a.note} className="mt-3" />
      <Modal
        open={dlg}
        onOpenChange={(o) => !o && !a.busy && setDlg(false)}
        title={m('resolveTitle')}
        intro={m('resolveHelp')}
        closeLabel={msg(locale, 'common.close')}
      >
        <form
          className="grid gap-3"
          onSubmit={async (e) => {
            e.preventDefault();
            const n = String(new FormData(e.currentTarget).get('note') ?? '');
            setInner(null);
            const r = await a.run('resolve', () => resolveTicket(locale, ticket, n));
            if (r?.ok) setDlg(false);
            else if (r) setInner(r);
          }}
        >
          <label className="form-field">
            {m('resolveNote')}
            <textarea name="note" rows={3} maxLength={4000} />
          </label>
          <ActionNotice locale={locale} note={inner} />
          <div className="flex justify-end">
            <button type="submit" className="btn btn-gold" data-action="tk.resolve.confirm" disabled={a.locked}>
              {m('resolve')}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}

// ───────── content ─────────

export interface PostEdit {
  id?: string;
  category: string;
  title: string;
  title_ur: string;
  body: string;
  body_ur: string;
  status: string;
}

/** post.create / post.edit */
export function PostForm({ locale, post }: { locale: Locale; post?: PostEdit }) {
  const m = (k: string, v?: Record<string, string>) => msg(locale, `eng.content.${k}`, v);
  const a = useAction(locale);
  const [open, setOpen] = useState(false);
  const [inner, setInner] = useState<Outcome | null>(null);
  const p = post;
  return (
    <>
      {p ? (
        <button
          type="button"
          className="btn btn-w"
          data-action="post.edit"
          aria-label={m('edit', { title: p.title })}
          onClick={() => (setInner(null), setOpen(true))}
        >
          <Pencil size={16} aria-hidden />
        </button>
      ) : (
        <button
          type="button"
          className="btn btn-primary"
          data-action="post.create"
          onClick={() => (setInner(null), setOpen(true))}
        >
          <Plus size={16} aria-hidden /> {m('new')}
        </button>
      )}
      {!p && <ActionNotice locale={locale} note={a.note} />}
      <Modal
        open={open}
        onOpenChange={(o) => !o && !a.busy && setOpen(false)}
        title={p ? m('edit', { title: p.title }) : m('new')}
        closeLabel={msg(locale, 'common.close')}
        wide
      >
        <form
          className="grid gap-3"
          onSubmit={async (e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            fd.set('locale', locale);
            if (p?.id) fd.set('id', p.id);
            setInner(null);
            const r = await a.run('save', () => savePost(fd));
            if (r?.ok) setOpen(false);
            else if (r) setInner(r);
          }}
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="form-field">
              {m('form.category')}
              <select name="category" defaultValue={p?.category ?? 'News'}>
                {(['News', 'Notice', 'Circular', 'Event'] as const).map((c) => (
                  <option key={c} value={c}>
                    {msg(locale, `site.news.categories.${c}`)}
                  </option>
                ))}
              </select>
            </label>
            <label className="form-field">
              {m('form.status')}
              <select name="status" defaultValue={p?.status ?? 'Draft'}>
                {(['Draft', 'Live', 'Archived'] as const).map((s) => (
                  <option key={s} value={s}>
                    {m(`statuses.${s}`)}
                  </option>
                ))}
              </select>
            </label>
            <label className="form-field">
              {m('form.title')}
              <input name="title" required minLength={3} maxLength={200} defaultValue={p?.title} />
            </label>
            <label className="form-field">
              {m('form.titleUr')}
              <input name="title_ur" maxLength={200} defaultValue={p?.title_ur} dir="rtl" lang="ur" />
            </label>
          </div>
          <label className="form-field">
            {m('form.body')}
            <textarea name="body" rows={6} required minLength={3} maxLength={20000} defaultValue={p?.body} />
          </label>
          <label className="form-field">
            {m('form.bodyUr')}
            <textarea name="body_ur" rows={6} maxLength={20000} defaultValue={p?.body_ur} dir="rtl" lang="ur" />
          </label>
          <ActionNotice locale={locale} note={inner} />
          <div className="flex justify-end">
            <button type="submit" className="btn btn-primary" data-action="post.save" disabled={a.locked}>
              {m('form.save')}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}

/** tpl.test: a sample of one template to the staff member's own email */
export function TestEmail({ locale, template, event }: { locale: Locale; template: string; event: string }) {
  const a = useAction(locale);
  return (
    <span className="flex flex-col items-end gap-1">
      <button
        type="button"
        className="btn btn-w"
        data-action="tpl.test"
        aria-label={msg(locale, 'eng.notify.testFor', { event })}
        disabled={a.locked}
        onClick={() => void a.run('test', () => sendTestEmail(locale, template))}
      >
        <Send size={16} aria-hidden /> {msg(locale, 'eng.notify.test')}
      </button>
      <ActionNotice locale={locale} note={a.note} />
    </span>
  );
}
