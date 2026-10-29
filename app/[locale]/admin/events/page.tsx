import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { EventForm } from '@/components/engagement/forms';
import { guardStaff } from '@/components/services/staff-page';
import { EventsCalendar } from '@/components/site/events-calendar';
import { asLocale } from '@/i18n/locale';
import { msg } from '@/lib/nav/model';
import { requireUser } from '@/lib/permissions/server';
import { createClient } from '@/lib/supabase/server';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return { title: msg(asLocale((await params).locale), 'eng.events.adminTitle') };
}

export const dynamic = 'force-dynamic';

const pkInput = (iso: string) => {
  // yyyy-mm-ddThh:mm in Pakistan time, for <input type="datetime-local">
  const d = new Date(new Date(iso).getTime() + 5 * 3_600_000);
  return d.toISOString().slice(0, 16);
};

/** Events (prototype admin/events): calendar, the events with registrations, create / edit (eng ≥ 2) */
export default async function AdminEventsPage({ params }: Props) {
  const locale = asLocale((await params).locale);
  setRequestLocale(locale);
  const session = await requireUser();
  const g = guardStaff(session, locale, 'eng', 'eng.events.adminTitle');
  if (g.denied) return g.denied;
  const m = (k: string, v?: Record<string, string>) => msg(locale, `eng.events.${k}`, v);
  const supabase = await createClient();
  const [{ data: events }, { data: regs }] = await Promise.all([
    supabase
      .from('events')
      .select('id, title, title_ur, type, starts_at, venue, seats, body, body_ur, published')
      .order('starts_at', { ascending: false }),
    supabase.from('event_registrations').select('event_id'),
  ]);
  const rows = events ?? [];
  const when = (iso: string) =>
    new Date(iso).toLocaleString(locale === 'ur' ? 'ur-PK' : 'en-GB', {
      timeZone: 'Asia/Karachi',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  const canEdit = g.level >= 2;
  return (
    <div className="proto">
      <div className="ph">
        <div>
          <h1>{m('adminTitle')}</h1>
        </div>
        <div className="pb">{canEdit && <EventForm locale={locale} />}</div>
      </div>
      <EventsCalendar
        locale={locale}
        events={rows.map((e) => ({
          id: e.id,
          title: e.title,
          day: new Date(e.starts_at).toLocaleDateString('en-CA', { timeZone: 'Asia/Karachi' }),
          when: when(e.starts_at),
          venue: e.venue ?? '',
          seats: e.seats ? msg(locale, 'site.news.seats', { n: String(e.seats) }) : '',
        }))}
        t={{
          prev: msg(locale, 'site.news.prevMonth'),
          next: msg(locale, 'site.news.nextMonth'),
          dayEvents: msg(locale, 'site.news.dayEvents'),
          noDayEvents: msg(locale, 'site.news.noDayEvents'),
          noEvents: msg(locale, 'site.news.noEvents'),
          events: msg(locale, 'site.news.events'),
        }}
      />
      <section className="card" aria-labelledby="ev-h" style={{ marginTop: 18 }}>
        <div className="ch">
          <h3 id="ev-h">{m('table')}</h3>
        </div>
        {rows.length ? (
          <div className="tw" tabIndex={0} role="region" aria-label={m('table')}>
            <table>
              <thead>
                <tr>
                  {(['event', 'date', 'registered', 'status'] as const).map((c) => (
                    <th key={c} scope="col">
                      {m(`cols.${c}`)}
                    </th>
                  ))}
                  <th scope="col">
                    <span className="sr-only">{m('edit', { title: '' })}</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((e) => {
                  const n = (regs ?? []).filter((r) => r.event_id === e.id).length;
                  const past = new Date(e.starts_at).getTime() < Date.now();
                  return (
                    <tr className="st" key={e.id} data-event={e.id}>
                      <td>
                        <b>{e.title}</b>
                        {e.type ? <small className="muted"> · {e.type}</small> : null}
                      </td>
                      <td>{when(e.starts_at)}</td>
                      <td>
                        {n}
                        {e.seats ? `/${e.seats}` : ''}
                      </td>
                      <td>
                        <span className={`bd ${past ? 'gray' : e.published ? 'green' : 'orange'}`}>
                          {past ? m('past') : e.published ? m('published') : m('draft')}
                        </span>
                      </td>
                      <td>
                        {canEdit && (
                          <EventForm
                            locale={locale}
                            event={{
                              id: e.id,
                              title: e.title,
                              title_ur: e.title_ur ?? '',
                              type: e.type ?? '',
                              starts_at: pkInput(e.starts_at),
                              venue: e.venue ?? '',
                              seats: e.seats ? String(e.seats) : '',
                              body: e.body ?? '',
                              body_ur: e.body_ur ?? '',
                              published: e.published,
                            }}
                          />
                        )}
                      </td>
                    </tr>
                  );
                })}
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
