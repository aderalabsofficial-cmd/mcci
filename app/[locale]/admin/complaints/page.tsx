import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { TicketReply, TicketStaff } from '@/components/engagement/forms';
import { Kpi } from '@/components/review/kpi';
import { guardStaff } from '@/components/services/staff-page';
import { Link } from '@/i18n/navigation';
import { asLocale } from '@/i18n/locale';
import { msg } from '@/lib/nav/model';
import { requireUser } from '@/lib/permissions/server';
import { createClient } from '@/lib/supabase/server';

type Props = { params: Promise<{ locale: string }>; searchParams: Promise<{ t?: string; q?: string; s?: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return { title: msg(asLocale((await params).locale), 'eng.tk.title') };
}

export const dynamic = 'force-dynamic';

const TONE: Record<string, string> = { Open: 'blue', 'In progress': 'orange', Resolved: 'green', Closed: 'gray' };

/**
 * Complaint Desk (prototype admin/complaints): tickets from members (Help & Support) and from the public site (contact
 * form, complaint desk); assign, reply and resolve (eng ≥ 2); the requester is told by email and in the portal.
 */
export default async function ComplaintsPage({ params, searchParams }: Props) {
  const locale = asLocale((await params).locale);
  setRequestLocale(locale);
  const session = await requireUser();
  const g = guardStaff(session, locale, 'eng', 'eng.tk.title');
  if (g.denied) return g.denied;
  const m = (k: string, v?: Record<string, string>) => msg(locale, `eng.tk.${k}`, v);
  const sp = await searchParams;
  const supabase = await createClient();
  const [{ data: tickets }, { data: staff }] = await Promise.all([
    supabase
      .from('tickets')
      .select(
        'id, name, email, subject, body, status, assigned_to, company_id, created_by, created_at, companies(name)',
      )
      .order('created_at', { ascending: false })
      .limit(300),
    supabase.schema('api').rpc('staff_directory'),
  ]);
  const rows = tickets ?? [];
  const team = ((staff ?? []) as { user_id: string; full_name: string | null; active: boolean }[])
    .filter((s) => s.active)
    .map((s) => ({ id: s.user_id, name: s.full_name ?? '—' }));
  const owner = (id: string | null) => (id ? (team.find((s) => s.id === id)?.name ?? '—') : m('unassigned'));
  const open = sp.t ? rows.find((r) => r.id === sp.t) : null;
  const { data: thread } = open
    ? await supabase
        .from('ticket_messages')
        .select('id, body, by_name, by_user, at')
        .eq('ticket_id', open.id)
        .order('at')
    : { data: [] as { id: number; body: string; by_name: string | null; by_user: string | null; at: string }[] };
  const when = (iso: string) =>
    new Date(iso).toLocaleString(locale === 'ur' ? 'ur-PK' : 'en-GB', {
      timeZone: 'Asia/Karachi',
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  const from = (r: (typeof rows)[number]) => (r.companies as unknown as { name: string } | null)?.name ?? r.name ?? '—';
  // search and status filter (prototype "Search tickets…" / "All statuses"), as a plain GET form
  const q = (sp.q ?? '').trim().toLowerCase();
  const shown = rows.filter(
    (r) =>
      (!sp.s || r.status === sp.s) &&
      (!q || [r.id, from(r), r.subject, r.email ?? ''].some((x) => String(x).toLowerCase().includes(q))),
  );
  return (
    <div className="proto">
      <div className="ph">
        <div>
          <h1>{m('title')}</h1>
        </div>
      </div>
      <div className="kg">
        <Kpi label={m('kOpen')} value={rows.filter((r) => r.status === 'Open').length} icon="help" color="#f59e0b" />
        <Kpi
          label={m('kProgress')}
          value={rows.filter((r) => r.status === 'In progress').length}
          icon="clock"
          color="#3b82f6"
        />
        <Kpi
          label={m('kResolved')}
          value={rows.filter((r) => r.status === 'Resolved').length}
          icon="check"
          color="#1fa34a"
        />
        <Kpi label={m('kPublic')} value={rows.filter((r) => !r.created_by).length} icon="globe" color="#c8963e" />
      </div>
      {open && (
        <section className="card" aria-labelledby="th-h" data-thread={open.id} style={{ marginBottom: 18 }}>
          <div className="ch">
            <h3 id="th-h">
              {open.id} · {open.subject}
            </h3>
            <span className={`bd ${TONE[open.status] ?? 'gray'}`}>{m(`status.${open.status}`)}</span>
          </div>
          {g.level >= 2 && (
            <TicketStaff
              locale={locale}
              ticket={open.id}
              staff={team}
              assigned={open.assigned_to}
              open={open.status === 'Open' || open.status === 'In progress'}
            />
          )}
          <h4 style={{ margin: '14px 0 6px', fontWeight: 800 }}>{m('thread')}</h4>
          <div className="li st">
            <div>
              <b>{from(open)}</b>
              {open.email ? <small> · {open.email}</small> : null}
              <small style={{ whiteSpace: 'pre-wrap', display: 'block' }}>{open.body}</small>
              <small>{when(open.created_at)}</small>
            </div>
          </div>
          {(thread ?? []).map((x) => (
            <div className="li st" key={x.id}>
              <div>
                <b>{x.by_name ?? (x.by_user ? '—' : from(open))}</b>
                <small style={{ whiteSpace: 'pre-wrap', display: 'block' }}>{x.body}</small>
                <small>{when(x.at)}</small>
              </div>
            </div>
          ))}
          {g.level >= 2 && <TicketReply locale={locale} ticket={open.id} />}
        </section>
      )}
      <section className="card" aria-labelledby="tl-h">
        <div className="ch">
          <h3 id="tl-h">{m('table')}</h3>
        </div>
        <form className="tbar" role="search" aria-label={m('search')}>
          <input name="q" defaultValue={sp.q ?? ''} placeholder={m('search')} aria-label={m('search')} maxLength={100} />
          <select name="s" defaultValue={sp.s ?? ''} aria-label={m('statusFilter')}>
            <option value="">{m('allStatuses')}</option>
            {Object.keys(TONE).map((x) => (
              <option key={x} value={x}>
                {m(`status.${x}`)}
              </option>
            ))}
          </select>
          <button className="btn" data-action="ticket.filter">
            {m('filter')}
          </button>
        </form>
        {shown.length ? (
          <div className="tw" tabIndex={0} role="region" aria-label={m('table')}>
            <table>
              <thead>
                <tr>
                  {(['ticket', 'from', 'subject', 'owner', 'opened', 'status'] as const).map((c) => (
                    <th key={c} scope="col">
                      {m(`cols.${c}`)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {shown.map((r) => (
                  <tr className="st" key={r.id} data-ticket={r.id}>
                    <td>
                      <Link
                        className="rowlink"
                        href={`/admin/complaints?${new URLSearchParams({ ...(sp.q ? { q: sp.q } : {}), ...(sp.s ? { s: sp.s } : {}), t: r.id })}`}
                        data-action="ticket.view"
                      >
                        {r.id}
                      </Link>
                    </td>
                    <td>{from(r)}</td>
                    <td>{r.subject}</td>
                    <td>{owner(r.assigned_to)}</td>
                    <td>{when(r.created_at)}</td>
                    <td>
                      <span className={`bd ${TONE[r.status] ?? 'gray'}`}>{m(`status.${r.status}`)}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="em">{m('none')}</p>
        )}
      </section>
    </div>
  );
}
