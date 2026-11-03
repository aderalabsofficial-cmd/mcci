import type { Locale } from '@/i18n/routing';
import { msg } from '@/lib/nav/model';
import { loadPosts, postCategory } from '@/lib/site/load';
import { readOr } from '@/lib/site/read-or';
import { TickerBar, type TickerItem } from './ticker-bar';

/** at most this many of the newest published posts run in the bar */
export const TICKER_POSTS = 8;

/**
 * The news ticker above the public header (as on mcci.org.pk, owner 3 Nov 2026): the newest published News &
 * Notifications posts, each opening its post. Nothing published, or the read failed: no bar at all, never a made-up line.
 */
export async function NewsTicker({ locale }: { locale: Locale }) {
  const posts = await readOr('ticker', loadPosts(TICKER_POSTS));
  if (!posts?.length) return null;
  const items: TickerItem[] = posts.map((p) => ({
    id: p.id,
    title: locale === 'ur' ? p.title_ur || p.title : p.title,
    category: p.category ? postCategory(p.category, locale) : null,
  }));
  const m = (k: string) => msg(locale, `site.ticker.${k}`);
  return (
    <TickerBar
      items={items}
      text={{ label: m('label'), latest: m('latest'), all: m('all'), pause: m('pause'), play: m('play') }}
    />
  );
}
