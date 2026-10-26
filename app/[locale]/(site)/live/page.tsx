import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { PageHero, Section, SitePage } from '@/components/site/blocks';
import { Feed } from '@/components/site/feed';
import { LiveRefresh } from '@/components/site/live-refresh';
import { asLocale } from '@/i18n/locale';
import { msg } from '@/lib/nav/model';
import { siteFeed, siteStats } from '@/lib/site/admin';
import { loadServices } from '@/lib/site/load';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return { title: msg(asLocale((await params).locale), 'site.board.title') };
}

export const dynamic = 'force-dynamic';

/** Live board (prototype site/live): anonymised chamber activity for the lobby screen; refreshes itself every minute */
export default async function LivePage({ params }: Props) {
  const locale = asLocale((await params).locale);
  setRequestLocale(locale);
  const m = (k: string) => msg(locale, `site.board.${k}`);
  const [stats, feed, services] = await Promise.all([siteStats(), siteFeed(12), loadServices()]);
  const tiles = [
    [stats.services_issued, 'issued'],
    [stats.temporary, 'temp'],
    [stats.converted, 'converted'],
    [stats.services_open + stats.applications_open, 'open'],
  ] as const;
  return (
    <SitePage locale={locale}>
      <LiveRefresh seconds={60} />
      <PageHero locale={locale} title="site.board.title" sub="site.board.sub" />
      <Section n={1} title={m('activity')} sub={m('activitySub')} id="activity">
        <div className="g4" style={{ marginBottom: 20 }}>
          {tiles.map(([n, k]) => (
            <div className="card st" key={k} data-tile={k}>
              <b style={{ fontSize: 30, fontWeight: 800 }}>{n.toLocaleString('en-US')}</b>
              <small className="muted" style={{ display: 'block' }}>
                {m(k)}
              </small>
            </div>
          ))}
        </div>
        <div className="card">
          <div className="ch">
            <h3>{m('feed')}</h3>
            <span className="xpulse">{m('live')}</span>
          </div>
          <Feed locale={locale} rows={feed} services={services} />
        </div>
      </Section>
    </SitePage>
  );
}
