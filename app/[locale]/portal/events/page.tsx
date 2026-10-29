import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { RegisterEvent } from '@/components/engagement/forms';
import { both, Ic, L } from '@/components/membership/ui';
import { EventsCalendar } from '@/components/site/events-calendar';
import { asLocale } from '@/i18n/locale';
import { msg } from '@/lib/nav/model';
import { requireUser } from '@/lib/permissions/server';
import { loadEvents } from '@/lib/site/load';
import { createClient } from '@/lib/supabase/server';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return { title: msg(asLocale((await params).locale), 'eng.events.title') };
}

export const dynamic = 'force-dynamic';

/** Events & Trade (prototype member/events): the calendar and upcoming events with one-tap registration for the company */
export default async function MemberEventsPage({ params }: Props) {
  const locale = asLocale((await params).locale);
  setRequestLocale(locale);
  const session = await requireUser();
  const m = (k: string, v?: Record<string, string>) => msg(locale, `eng.events.${k}`, v);
  const company = session.access.companies.find((c) => (c.levels.events ?? 0) >= 2) ?? null;
  const events = await loadEvents();
  const upcoming = events.filter((e) => new Date(e.starts_at).getTime() > Date.now());
  const supabase = await createClient();
  const { data: regs } = upcoming.length
    ? await supabase
        .from('event_registrations')
        .select('event_id, company_id')
        .in(
          'event_id',
          upcoming.map((e) => e.id),
        )
    : { data: [] as { event_id: string; company_id: string }[] };
  const t = (en: string, ur: string | null) => (locale === 'ur' ? ur || en : en);
  const when = (iso: string) =>
    new Date(iso).toLocaleString(locale === 'ur' ? 'ur-PK' : 'en-GB', {
      timeZone: 'Asia/Karachi',
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  return (
    <div className="proto">
      <div className="ph">
        <div>
          <h1>
            <L {...both('eng.events.title')} />
          </h1>
        </div>
      </div>
      <EventsCalendar
        locale={locale}
        events={events.map((e) => ({
          id: e.id,
          title: t(e.title, e.title_ur),
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
      <section className="card" aria-labelledby="up-h" style={{ marginTop: 18 }}>
        <div className="ch">
          <h3 id="up-h">{m('upcoming')}</h3>
        </div>
        {upcoming.length ? (
          upcoming.map((e) => {
            const count = (regs ?? []).filter((r) => r.event_id === e.id).length;
            const mine = company ? (regs ?? []).some((r) => r.event_id === e.id && r.company_id === company.id) : false;
            const left = e.seats ? Math.max(0, e.seats - count) : null;
            return (
              <div className="li st" key={e.id} data-event={e.id}>
                <i style={{ background: '#3b82f622' }} aria-hidden>
                  <Ic name="calendar" size={18} color="#3b82f6" />
                </i>
                <div style={{ flex: 1 }}>
                  <b>{t(e.title, e.title_ur)}</b>
                  <small>
                    {when(e.starts_at)}
                    {e.venue ? ` · ${e.venue}` : ''}
                    {left !== null ? ` · ${m('seatsLeft', { n: String(left) })}` : ''}
                  </small>
                </div>
                {company ? (
                  <RegisterEvent
                    locale={locale}
                    eventId={e.id}
                    companyId={company.id}
                    title={t(e.title, e.title_ur)}
                    state={mine ? 'registered' : left === 0 ? 'full' : 'open'}
                  />
                ) : null}
              </div>
            );
          })
        ) : (
          <p className="em">{m('none')}</p>
        )}
      </section>
    </div>
  );
}
