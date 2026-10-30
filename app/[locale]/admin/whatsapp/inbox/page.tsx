import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { guardStaff } from '@/components/services/staff-page';
import type { TemplateOption } from '@/components/whatsapp/composer';
import { ConversationForm, LinkForm, NoteForm, SendForm } from '@/components/whatsapp/forms';
import { Link } from '@/i18n/navigation';
import { asLocale } from '@/i18n/locale';
import { msg } from '@/lib/nav/model';
import { staffLevel } from '@/lib/permissions/levels';
import { requireUser } from '@/lib/permissions/server';
import {
  loadConversation,
  loadConversations,
  loadSettings,
  loadStaffOptions,
  loadTemplates,
} from '@/lib/whatsapp/load';

type Props = { params: Promise<{ locale: string }>; searchParams: Promise<{ c?: string; q?: string; show?: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return { title: msg(asLocale((await params).locale), 'screens.admin.wainbox') };
}

export const dynamic = 'force-dynamic';

const UUID = /^[0-9a-f-]{36}$/i;
const FILTERS = ['all', 'open', 'pending', 'resolved', 'unmatched'];

/** Replies and history, kept apart from any other system. An unmatched number waits for a person; nothing is merged by guess. */
export default async function InboxPage({ params, searchParams }: Props) {
  const locale = asLocale((await params).locale);
  setRequestLocale(locale);
  const session = await requireUser();
  const g = guardStaff(session, locale, 'out', 'screens.admin.wainbox', 2);
  if (g.denied) return g.denied;
  const m = (k: string, v?: Record<string, string>) => msg(locale, `wa.inbox.${k}`, v);
  const sp = await searchParams;
  const q = (sp.q ?? '').slice(0, 60);
  const show = FILTERS.includes(sp.show ?? '') ? sp.show! : 'all';
  const [list, open, settings, staff, templates] = await Promise.all([
    loadConversations(q, show),
    sp.c && UUID.test(sp.c) ? loadConversation(sp.c) : Promise.resolve(null),
    loadSettings(),
    loadStaffOptions(),
    loadTemplates(),
  ]);
  const when = (iso: string | null) =>
    iso
      ? new Date(iso).toLocaleString(locale === 'ur' ? 'ur-PK' : 'en-GB', {
          timeZone: 'Asia/Karachi',
          day: 'numeric',
          month: 'short',
          hour: '2-digit',
          minute: '2-digit',
        })
      : '—';
  const hours = settings.windowHours ?? 24;
  const windowEnd = open?.last_inbound_at
    ? new Date(new Date(open.last_inbound_at).getTime() + hours * 3_600_000)
    : null;
  const windowOpen = Boolean(windowEnd && windowEnd.getTime() > Date.now());
  const approved = templates.filter((t) => t.status === 'APPROVED') as unknown as TemplateOption[];
  const base = locale === 'ur' ? '/ur' : '';
  return (
    <div className="proto">
      <div className="ph">
        <div>
          <h1>{m('title')}</h1>
          <p>{m('sub')}</p>
        </div>
      </div>
      <form method="get" action={`${base}/admin/whatsapp/inbox`} className="card rep-filter">
        <label className="form-field">
          {m('search')}
          <input type="search" name="q" defaultValue={q} maxLength={60} data-field="inbox-q" />
        </label>
        <label className="form-field">
          {m('show')}
          <select name="show" defaultValue={show} data-field="inbox-show">
            {FILTERS.map((f) => (
              <option key={f} value={f}>
                {m(`filters.${f}`)}
              </option>
            ))}
          </select>
        </label>
        <button className="btn btn-w" data-action="wa.inbox.search">
          {m('apply')}
        </button>
      </form>
      <div className="wa-inbox">
        <div className="card wa-list" data-conversations={list.length}>
          {list.length === 0 && <p className="muted">{m('empty')}</p>}
          {list.map((c) => (
            <Link
              key={c.id}
              className={`wa-row ${open?.id === c.id ? 'on' : ''}`}
              href={`/admin/whatsapp/inbox?c=${c.id}`}
              data-action="wa.inbox.open"
              data-conversation={c.phone}
            >
              <b>{(c.companies as unknown as { name: string } | null)?.name ?? c.profile_name ?? c.phone}</b>
              <small dir="ltr">{c.phone}</small>
              <small>
                {when(c.last_inbound_at ?? c.last_outbound_at)} · {m(`states.${c.status}`)}
                {!c.company_id && ` · ${m('unmatched')}`}
              </small>
            </Link>
          ))}
        </div>
        <div className="wa-detail">
          {!open ? (
            <div className="card">
              <p className="muted">{m('pick')}</p>
            </div>
          ) : (
            <>
              <div className="card" data-thread={open.phone}>
                <div className="ch">
                  <h3>
                    {(open.companies as unknown as { name: string } | null)?.name ?? open.profile_name ?? open.phone}
                  </h3>
                  <span
                    className={`bd ${windowOpen ? 'green' : 'orange'}`}
                    data-window={windowOpen ? 'open' : 'closed'}
                  >
                    {windowOpen ? m('windowOpen', { at: when(windowEnd!.toISOString()) }) : m('windowClosed')}
                  </span>
                </div>
                <small dir="ltr">{open.phone}</small>
                {!open.company_id && <p className="banner orange">{m('unmatchedNote')}</p>}
                <ul className="wa-thread">
                  {open.messages.map((x) => (
                    <li key={x.id} className={x.direction === 'inbound' ? 'in' : 'out'} data-message={x.direction}>
                      <p dir="auto">{x.body ?? `[${x.kind}]`}</p>
                      <small>
                        {when(x.created_at)}
                        {x.direction === 'outbound' && (
                          <>
                            {' · '}
                            <span data-state={x.state}>{msg(locale, `wa.states.${x.state}`)}</span>
                            {x.failure_code ? ` · ${x.failure_code}` : ''}
                          </>
                        )}
                      </small>
                    </li>
                  ))}
                </ul>
              </div>
              {open.company_id ? (
                <div className="card" data-section="reply">
                  <div className="ch">
                    <h3>{m('reply')}</h3>
                  </div>
                  <SendForm
                    locale={locale}
                    company={open.company_id}
                    templates={approved}
                    windowOpen={windowOpen}
                    submitLabel={m('sendReply')}
                  />
                </div>
              ) : (
                staffLevel(session.access, 'out') >= 3 && (
                  <div className="card" data-section="link">
                    <div className="ch">
                      <h3>{m('linkTitle')}</h3>
                    </div>
                    <LinkForm locale={locale} id={open.id} />
                  </div>
                )
              )}
              <div className="card" data-section="manage">
                <ConversationForm
                  locale={locale}
                  id={open.id}
                  status={open.status}
                  assigned={open.assigned_to}
                  staff={staff}
                />
              </div>
              <div className="card" data-section="notes">
                <div className="ch">
                  <h3>{m('notes')}</h3>
                  <span className="bd orange">{m('notesInternal')}</span>
                </div>
                <NoteForm locale={locale} id={open.id} />
                <ul className="biz-history" data-notes={open.notes.length}>
                  {open.notes.map((n) => (
                    <li key={n.id}>
                      <b>{when(n.created_at)}</b>{' '}
                      {(n.profiles as unknown as { full_name: string | null } | null)?.full_name ?? ''}: {n.body}
                    </li>
                  ))}
                </ul>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
