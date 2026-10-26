'use client';

import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
import { useMemo, useState } from 'react';

export interface CalEvent {
  id: string;
  title: string;
  day: string; // yyyy-mm-dd in Asia/Karachi
  when: string; // formatted date and time
  venue: string;
  seats: string;
}

const pkDay = (d: Date) => d.toLocaleDateString('en-CA', { timeZone: 'Asia/Karachi' });

/**
 * The events calendar (prototype M.calendar, actions cal.move / cal.day) and the list of upcoming events. Client-side
 * only: it shows the published events the page already loaded.
 */
export function EventsCalendar({
  events,
  locale,
  t,
}: {
  events: CalEvent[];
  locale: 'en' | 'ur';
  t: { prev: string; next: string; dayEvents: string; noDayEvents: string; noEvents: string; events: string };
}) {
  const today = pkDay(new Date());
  const [month, setMonth] = useState(() => {
    const first = events.find((e) => e.day >= today)?.day ?? today;
    return first.slice(0, 7);
  });
  const [day, setDay] = useState<string | null>(null);
  const [y, mo] = month.split('-').map(Number) as [number, number];
  const cells = useMemo(() => {
    const start = new Date(Date.UTC(y, mo - 1, 1));
    const lead = (start.getUTCDay() + 6) % 7; // weeks start on Monday
    const days = new Date(Date.UTC(y, mo, 0)).getUTCDate();
    return [...Array(lead).fill(null), ...Array.from({ length: days }, (_, i) => `${month}-${String(i + 1).padStart(2, '0')}`)];
  }, [y, mo, month]);
  const byDay = useMemo(() => {
    const m = new Map<string, CalEvent[]>();
    for (const e of events) m.set(e.day, [...(m.get(e.day) ?? []), e]);
    return m;
  }, [events]);
  const move = (n: number) => {
    const d = new Date(Date.UTC(y, mo - 1 + n, 1));
    setMonth(`${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`);
    setDay(null);
  };
  const fmt = new Intl.DateTimeFormat(locale === 'ur' ? 'ur-PK' : 'en-GB', { month: 'long', year: 'numeric', timeZone: 'UTC' });
  const wk = Array.from({ length: 7 }, (_, i) =>
    new Intl.DateTimeFormat(locale === 'ur' ? 'ur-PK' : 'en-GB', { weekday: 'short', timeZone: 'UTC' }).format(new Date(Date.UTC(2024, 0, 1 + i))),
  );
  const list = day ? (byDay.get(day) ?? []) : events.filter((e) => e.day >= today);
  return (
    <div className="g2" style={{ gridTemplateColumns: '1.5fr 1fr' }}>
      <div className="card">
        <div className="ch">
          <h3>{fmt.format(new Date(Date.UTC(y, mo - 1, 1)))}</h3>
          <span className="flex gap-2">
            <button type="button" className="btn" aria-label={t.prev} data-action="cal.move" onClick={() => move(-1)}>
              <ChevronLeft size={16} aria-hidden className="rtl:rotate-180" />
            </button>
            <button type="button" className="btn" aria-label={t.next} data-action="cal.move" onClick={() => move(1)}>
              <ChevronRight size={16} aria-hidden className="rtl:rotate-180" />
            </button>
          </span>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center">
          {wk.map((w) => (
            <small key={w} className="muted" aria-hidden>
              {w}
            </small>
          ))}
          {cells.map((c, i) =>
            c ? (
              <button
                key={c}
                type="button"
                className="btn"
                style={{
                  padding: 0,
                  fontWeight: byDay.has(c) ? 800 : 500,
                  background: day === c ? 'var(--gold)' : byDay.has(c) ? 'var(--hov)' : undefined,
                  borderColor: c === today ? 'var(--gt)' : undefined,
                }}
                aria-pressed={day === c}
                aria-label={`${c}${byDay.has(c) ? ` · ${byDay.get(c)!.length} ${t.events}` : ''}`}
                data-action="cal.day"
                onClick={() => setDay(day === c ? null : c)}
              >
                {Number(c.slice(8))}
              </button>
            ) : (
              <span key={`e${i}`} />
            ),
          )}
        </div>
      </div>
      <div className="card">
        <div className="ch">
          <h3>{day ? t.dayEvents.replace('{date}', day) : t.events}</h3>
        </div>
        {list.length ? (
          list.map((e) => (
            <div className="li st" key={e.id} data-event={e.id}>
              <i style={{ background: '#3b82f622' }} aria-hidden>
                <CalendarDays size={18} color="#3b82f6" />
              </i>
              <div>
                <b>{e.title}</b>
                <small>
                  {e.when}
                  {e.venue ? ` · ${e.venue}` : ''}
                  {e.seats ? ` · ${e.seats}` : ''}
                </small>
              </div>
            </div>
          ))
        ) : (
          <p className="em">{day ? t.noDayEvents : t.noEvents}</p>
        )}
      </div>
    </div>
  );
}
