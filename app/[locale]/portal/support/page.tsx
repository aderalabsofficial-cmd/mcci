import { BookOpen, CircleHelp, Mail, MapPin, Phone, Sparkles } from 'lucide-react';
import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { setRequestLocale } from 'next-intl/server';
import { NewTicket, TicketReply } from '@/components/engagement/forms';
import { both, L } from '@/components/membership/ui';
import { Faq } from '@/components/site/membership-parts';
import { Link } from '@/i18n/navigation';
import { asLocale } from '@/i18n/locale';
import { loadPublicSettings } from '@/lib/membership/load';
import { msg } from '@/lib/nav/model';
import { requireUser } from '@/lib/permissions/server';
import { createClient } from '@/lib/supabase/server';

type Props = { params: Promise<{ locale: string }>; searchParams: Promise<{ t?: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return { title: msg(asLocale((await params).locale), 'eng.support.title') };
}

export const dynamic = 'force-dynamic';

const TONE: Record<string, string> = { Open: 'blue', 'In progress': 'orange', Resolved: 'green', Closed: 'gray' };

/**
 * Help & Support (prototype member/support): call, email, visit, guides, open a ticket; my tickets with the
 * conversation (?t=…) and replies; common questions. Ask MCCI AI is the next release (shown with that reason).
 */
export default async function SupportPage({ params, searchParams }: Props) {
  const locale = asLocale((await params).locale);
  setRequestLocale(locale);
  const session = await requireUser();
  const m = (k: string, v?: Record<string, string>) => msg(locale, `eng.support.${k}`, v);
  const [settings, sp] = await Promise.all([loadPublicSettings(), searchParams]);
  const supabase = await createClient();
  const { data: tickets } = await supabase
    .from('tickets')
    .select('id, subject, status, created_at')
    .order('created_at', { ascending: false })
    .limit(50);
  const open = sp.t ? (tickets ?? []).find((x) => x.id === sp.t) : null;
  const { data: thread } = open
    ? await supabase.from('ticket_messages').select('id, body, by_user, at').eq('ticket_id', open.id).order('at')
    : { data: [] as { id: number; body: string; by_user: string | null; at: string }[] };
  const { data: first } = open
    ? await supabase.from('tickets').select('body, created_by').eq('id', open.id).single()
    : { data: null };
  const company = session.access.companies[0]?.id ?? null;
  const f = settings.fees;
  const total = (c: 'Corporate' | 'Associate' | 'Women') =>
    (f[c].admission + f[c].subscription + f[c].card).toLocaleString('en-US');
  const fees = {
    corporate: total('Corporate'),
    associate: total('Associate'),
    women: total('Women'),
    extra: f.extraCard.toLocaleString('en-US'),
  };
  const tel = settings.chamber.tel.split(',')[0]!.replace(/[^\d+]/g, '');
  const when = (iso: string) =>
    new Date(iso).toLocaleString(locale === 'ur' ? 'ur-PK' : 'en-GB', {
      timeZone: 'Asia/Karachi',
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  const tile = (icon: ReactNode, color: string, title: string, sub: string) => (
    <>
      <i style={{ background: `${color}22` }}>{icon}</i>
      <b>{m(title)}</b>
      <span lang="ur">{msg('ur', `eng.support.${title}`)}</span>
      <small>{sub}</small>
    </>
  );
  return (
    <div className="proto">
      <div className="ph">
        <div>
          <h1>
            <L {...both('eng.support.help')} />
          </h1>
          <p>{m('sub')}</p>
        </div>
      </div>
      <div className="btg">
        <a className="bt" href={`tel:+${tel.replace(/^\+/, '')}`} data-action="help.call">
          {tile(
            <Phone size={28} color="#1b4f9c" aria-hidden />,
            '#1b4f9c',
            'call',
            settings.chamber.tel.split(',')[0]!,
          )}
        </a>
        <a className="bt" href={`mailto:${settings.chamber.email}`} data-action="help.email">
          {tile(<Mail size={28} color="#1fa34a" aria-hidden />, '#1fa34a', 'email', settings.chamber.email)}
        </a>
        <button type="button" className="bt" data-action="ai.open" disabled title={m('aiSoon')}>
          {tile(<Sparkles size={28} color="#c8963e" aria-hidden />, '#c8963e', 'ai', m('aiSoon'))}
        </button>
        <NewTicket locale={locale} companyId={company}>
          {tile(<CircleHelp size={28} color="#8b5cf6" aria-hidden />, '#8b5cf6', 'ticket', m('ticketSub'))}
        </NewTicket>
        <a
          className="bt"
          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${settings.chamber.name}, ${settings.chamber.addr}`)}`}
          target="_blank"
          rel="noopener noreferrer"
          data-action="help.visit"
        >
          {tile(<MapPin size={28} color="#ef4444" aria-hidden />, '#ef4444', 'visit', m('visitSub'))}
        </a>
        <Link className="bt" href="/resources" data-action="nav">
          {tile(<BookOpen size={28} color="#14b8a6" aria-hidden />, '#14b8a6', 'guides', m('guidesSub'))}
        </Link>
      </div>
      <div className="gr" style={{ gridTemplateColumns: '1fr 1.2fr', marginTop: 18 }}>
        <section className="card" aria-labelledby="tk-h">
          <div className="ch">
            <h3 id="tk-h">{m('mine')}</h3>
          </div>
          {tickets?.length ? (
            tickets.map((x) => (
              <Link
                className="li"
                key={x.id}
                href={`/portal/support?t=${x.id}`}
                data-action="ticket.view"
                data-ticket={x.id}
                aria-current={open?.id === x.id ? 'true' : undefined}
              >
                <i style={{ background: x.status === 'Resolved' ? '#1fa34a22' : '#3b82f622' }} aria-hidden>
                  <CircleHelp size={18} color={x.status === 'Resolved' ? '#1fa34a' : '#3b82f6'} />
                </i>
                <div style={{ flex: 1 }}>
                  <b>{x.subject}</b>
                  <small>
                    {x.id} · {when(x.created_at)}
                  </small>
                </div>
                <span className={`bd ${TONE[x.status] ?? 'gray'}`}>{msg(locale, `eng.tk.status.${x.status}`)}</span>
              </Link>
            ))
          ) : (
            <p className="em">{m('noTickets')}</p>
          )}
        </section>
        {open ? (
          <section className="card" aria-labelledby="th-h" data-thread={open.id}>
            <div className="ch">
              <h3 id="th-h">
                {open.id} · {open.subject}
              </h3>
              <Link href="/portal/support" data-action="nav">
                {m('back')}
              </Link>
            </div>
            <div className="li st">
              <div>
                <b>{m('you')}</b>
                <small style={{ whiteSpace: 'pre-wrap', display: 'block' }}>{first?.body}</small>
                <small>{when(open.created_at)}</small>
              </div>
            </div>
            {(thread ?? []).map((x) => (
              <div className="li st" key={x.id}>
                <div>
                  <b>{x.by_user === session.userId ? m('you') : m('mcci')}</b>
                  <small style={{ whiteSpace: 'pre-wrap', display: 'block' }}>{x.body}</small>
                  <small>{when(x.at)}</small>
                </div>
              </div>
            ))}
            <TicketReply locale={locale} ticket={open.id} />
          </section>
        ) : (
          <section className="card" aria-labelledby="fq-h">
            <div className="ch">
              <h3 id="fq-h">{m('faq')}</h3>
            </div>
            <Faq
              items={[1, 2, 3, 4, 5].map((i) => ({
                q: msg(locale, `site.membership.q${i}`),
                a: msg(locale, `site.membership.a${i}`, fees),
              }))}
            />
          </section>
        )}
      </div>
    </div>
  );
}
