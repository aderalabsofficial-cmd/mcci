import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';
import { msg } from '@/lib/nav/model';
import { loadPosts, postCategory } from '@/lib/site/load';
import { readOr } from '@/lib/site/read-or';
import { TICKER_POSTS } from '@/components/site/news-ticker';

/**
 * The design's top news bar (#topbar) with MCCI's newest published News & Notifications posts, each opening its post.
 * Nothing published, or the read failed: no bar at all, never a made-up line. Pause: WebFx (#tbPause, WCAG 2.2.2).
 */
export async function WebTicker({ locale }: { locale: Locale }) {
  const posts = await readOr('ticker', loadPosts(TICKER_POSTS));
  if (!posts?.length) return null;
  const t = (k: string) => msg(locale, `site.ticker.${k}`);
  const items = posts.map((p) => ({
    id: p.id,
    title: locale === 'ur' ? p.title_ur || p.title : p.title,
    category: p.category ? postCategory(p.category, locale) : null,
  }));
  const run = (copy: boolean) =>
    items.map((i) => (
      <Link
        key={`${copy ? 'b' : 'a'}${i.id}`}
        className="tb-item"
        href={`/news?post=${i.id}#post`}
        tabIndex={copy ? -1 : undefined}
        aria-hidden={copy || undefined}
        data-action="ticker.post"
        data-post={i.id}
      >
        {i.category && <b>{i.category}</b>}
        <span>{i.title}</span>
      </Link>
    ));
  return (
    <div className="topbar" id="topbar" role="region" aria-label={t('label')} data-ticker>
      <div className="topbar-in">
        <Link className="tb-label" href="/news#latest" aria-label={t('all')} data-action="ticker.all">
          <svg viewBox="0 0 24 24" aria-hidden>
            <path d="m3 11 15-6v14L3 13z" />
            <path d="M11.6 16.8a3 3 0 1 1-5.8-1.6" />
          </svg>
          <span>{msg(locale, 'landing.tb_latest')}</span>
        </Link>
        <div className="tb-marquee">
          <div className="tb-track">
            {run(false)}
            {run(true)}
          </div>
        </div>
        <button
          className="tb-pause"
          id="tbPause"
          type="button"
          aria-pressed="false"
          aria-label={t('pause')}
          data-label-play={t('play')}
          data-label-pause={t('pause')}
          data-action="ticker.pause"
        >
          <svg viewBox="0 0 24 24" aria-hidden>
            <path className="ps" d="M9 5v14M15 5v14" />
            <path className="pl" d="M7 5l12 7-12 7z" />
          </svg>
        </button>
      </div>
    </div>
  );
}
