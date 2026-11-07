import type { Metadata } from 'next';
import Image from 'next/image';
import { setRequestLocale } from 'next-intl/server';
import { MediaGallery } from '@/components/content/media';
import { EventsCalendar } from '@/components/site/events-calendar';
import { NewsMain } from '@/components/web/gen/news.gen';
import { webProps } from '@/components/web/props';
import { Link } from '@/i18n/navigation';
import { asLocale } from '@/i18n/locale';
import { voucherDate } from '@/lib/committee/voucher';
import { contentMediaUrl } from '@/lib/content/media';
import { msg } from '@/lib/nav/model';
import { loadEvents, loadPosts, loadPublicMedia, postCategory } from '@/lib/site/load';
import { readOr } from '@/lib/site/read-or';

type Props = { params: Promise<{ locale: string }>; searchParams: Promise<{ post?: string; channel?: string }> };

const CHANNELS = ['all', 'News', 'Notice', 'Circular', 'Event'] as const;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return { title: msg(asLocale((await params).locale), 'site.news.pageTitle') };
}

export const dynamic = 'force-dynamic';

/**
 * News & Notifications (owner's website design, 6 Nov 2026). What MCCI publishes in the admin Content screen comes
 * first ("Latest from the chamber", with channels, and one post opened from the news bar or a card), in the design's
 * cards; then the design's coverage of the chamber's recent work, the official notifications and the elections; then
 * the real events calendar.
 */
export default async function NewsPage({ params, searchParams }: Props) {
  const locale = asLocale((await params).locale);
  setRequestLocale(locale);
  const m = (k: string, v?: Record<string, string>) => msg(locale, `site.news.${k}`, v);
  const [read, events, sp, readMedia] = await Promise.all([
    readOr('posts', loadPosts(30)),
    readOr('events', loadEvents()),
    searchParams,
    readOr('media', loadPublicMedia()),
  ]);
  const allPosts = read ?? [];
  const media = readMedia ?? [];
  const channel = (CHANNELS as readonly string[]).includes(sp.channel ?? '') ? sp.channel! : 'all';
  const posts = channel === 'all' ? allPosts : allPosts.filter((p) => p.category === channel);
  const open = allPosts.find((p) => p.id === sp.post) ?? null;
  const t = (en: string, ur: string | null) => (locale === 'ur' ? ur || en : en);
  const cover = (postId: string) => media.find((x) => x.post_id === postId && x.kind === 'image');
  const when = (iso: string | null) => (iso ? voucherDate(iso, locale) : '');

  const latest = (
    <>
      {open && (
        <section className="sec white" id="post" aria-labelledby="post-h">
          <div className="wrap">
            <article className="news-feature" data-post={open.id}>
              <div>
                <span className="tag-pill">
                  {open.category ? `${postCategory(open.category, locale)} · ` : ''}
                  {when(open.published_at)}
                </span>
                <h3 id="post-h">{t(open.title, open.title_ur)}</h3>
                <MediaGallery locale={locale} media={media.filter((x) => x.post_id === open.id)} />
                <p style={{ whiteSpace: 'pre-wrap' }}>{t(open.body, open.body_ur)}</p>
                <Link className="link-arrow" href="/news#latest" data-action="nav">
                  {msg(locale, 'common.close')}
                </Link>
              </div>
            </article>
          </div>
        </section>
      )}

      <section className="sec paper" id="latest" aria-labelledby="latest-h">
        <div className="wrap">
          <div className="sec-head">
            <div>
              <p className="eyebrow">{msg(locale, 'landing.sub_news')}</p>
              <h2 id="latest-h">{m('latest')}</h2>
            </div>
            <nav className="tabs-bar" aria-label={m('channels')}>
              {CHANNELS.map((c) => (
                <Link
                  key={c}
                  href={c === 'all' ? '/news#latest' : `/news?channel=${c}#latest`}
                  aria-current={channel === c ? 'true' : undefined}
                  className={channel === c ? 'on' : undefined}
                  data-action="news.channel"
                  data-channel={c}
                >
                  {c === 'all' ? m('allChannels') : postCategory(c, locale)}
                </Link>
              ))}
            </nav>
          </div>
          {!read ? (
            <p className="read-failed" role="status" data-read-failed>
              {msg(locale, 'landing.read_failed')}
            </p>
          ) : posts.length ? (
            <div className="news-cards">
              {posts.map((p) => {
                const img = cover(p.id);
                return (
                  <article className="ncard" key={p.id} data-post-card={p.id}>
                    <div className="ph">
                      {img ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={contentMediaUrl(img.path)} alt={img.caption ?? ''} loading="lazy" />
                      ) : (
                        <Image
                          src="/images/landing/chamber-hq.jpg"
                          alt=""
                          width={1893}
                          height={831}
                          sizes="(max-width: 700px) 100vw, 33vw"
                        />
                      )}
                    </div>
                    <div>
                      <time>
                        {p.category ? `${postCategory(p.category, locale)} · ` : ''}
                        {when(p.published_at)}
                      </time>
                      <h3>{t(p.title, p.title_ur)}</h3>
                      <p>{t(p.body, p.body_ur).slice(0, 180)}</p>
                      <Link className="link-arrow" href={`/news?post=${p.id}#post`} data-action="post.view">
                        {msg(locale, 'landing.read_more')}
                      </Link>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <p className="em">{m('none')}</p>
          )}
        </div>
      </section>
    </>
  );

  return (
    <>
      <NewsMain {...webProps(locale, { latest })} />

      <section className="sec paper" id="events" aria-labelledby="events-h">
        <div className="wrap">
          <div className="sec-head">
            <div>
              <h2 id="events-h">{m('upcoming')}</h2>
            </div>
          </div>
          {!events ? (
            <p className="read-failed" role="status" data-read-failed>
              {msg(locale, 'landing.read_failed')}
            </p>
          ) : (
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
              t={{
                prev: m('prevMonth'),
                next: m('nextMonth'),
                dayEvents: m('dayEvents'),
                noDayEvents: m('noDayEvents'),
                noEvents: m('noEvents'),
                events: m('events'),
              }}
            />
          )}
        </div>
      </section>
    </>
  );
}
