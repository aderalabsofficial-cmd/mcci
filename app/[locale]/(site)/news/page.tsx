import { Award } from 'lucide-react';
import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { C, Card, PageHero, Section, SitePage } from '@/components/site/blocks';
import { EventsCalendar } from '@/components/site/events-calendar';
import { Link } from '@/i18n/navigation';
import { asLocale } from '@/i18n/locale';
import { voucherDate } from '@/lib/committee/voucher';
import { msg } from '@/lib/nav/model';
import { loadEvents, loadPosts, postCategory } from '@/lib/site/load';

type Props = { params: Promise<{ locale: string }>; searchParams: Promise<{ post?: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return { title: msg(asLocale((await params).locale), 'site.news.pageTitle') };
}

export const dynamic = 'force-dynamic';

/**
 * News & Events (prototype site/news): published posts (post.view opens one here) and the events calendar. Content is
 * written by MCCI in the admin Content screen (M8); until then the empty states say so.
 */
export default async function NewsPage({ params, searchParams }: Props) {
  const locale = asLocale((await params).locale);
  setRequestLocale(locale);
  const m = (k: string, v?: Record<string, string>) => msg(locale, `site.news.${k}`, v);
  const [posts, events, sp] = await Promise.all([loadPosts(30), loadEvents(), searchParams]);
  const open = posts.find((p) => p.id === sp.post) ?? null;
  const t = (en: string, ur: string | null) => (locale === 'ur' ? ur || en : en);
  return (
    <SitePage locale={locale}>
      <PageHero locale={locale} title="site.news.pageTitle" sub="site.news.pageSub" />
      {open && (
        <section className="sx" aria-labelledby="post-h" id="post">
          <div className="wr">
            <article className="card" style={{ maxWidth: 820, margin: 'auto' }} data-post={open.id}>
              <p className="muted">
                {open.category ? `${postCategory(open.category, locale)} · ` : ''}
                {open.published_at ? voucherDate(open.published_at, locale) : ''}
              </p>
              <h2 id="post-h" style={{ fontSize: 28, fontWeight: 800, margin: '6px 0 12px' }}>
                {t(open.title, open.title_ur)}
              </h2>
              <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.7 }}>{t(open.body, open.body_ur)}</div>
              <p style={{ marginTop: 16 }}>
                <Link className="btn" href="/news" data-action="nav">
                  {msg(locale, 'common.close')}
                </Link>
              </p>
            </article>
          </div>
        </section>
      )}
      <Section n={1} title={m('latest')} id="latest">
        {posts.length ? (
          <div className="g3">
            {posts.map((p) => (
              <Card
                key={p.id}
                icon={Award}
                color={C.CB}
                title={t(p.title, p.title_ur)}
                body={t(p.body, p.body_ur).slice(0, 180)}
                href={`/news?post=${p.id}#post`}
                action="post.view"
                more={p.category ? postCategory(p.category, locale) : m('read')}
              />
            ))}
          </div>
        ) : (
          <p className="em" style={{ textAlign: 'center' }}>
            {m('none')}
          </p>
        )}
      </Section>
      <Section n={2} title={m('upcoming')} alt id="events">
        <EventsCalendar
          locale={locale}
          events={events.map((e) => ({
            id: e.id,
            title: t(e.title, e.title_ur),
            day: new Date(e.starts_at).toLocaleDateString('en-CA', { timeZone: 'Asia/Karachi' }),
            when: new Date(e.starts_at).toLocaleString(locale === 'ur' ? 'ur-PK' : 'en-GB', {
              timeZone: 'Asia/Karachi',
              day: 'numeric',
              month: 'short',
              hour: '2-digit',
              minute: '2-digit',
            }),
            venue: e.venue ?? '',
            seats: e.seats ? m('seats', { n: String(e.seats) }) : '',
          }))}
          t={{ prev: m('prevMonth'), next: m('nextMonth'), dayEvents: m('dayEvents'), noDayEvents: m('noDayEvents'), noEvents: m('noEvents'), events: m('events') }}
        />
      </Section>
    </SitePage>
  );
}
