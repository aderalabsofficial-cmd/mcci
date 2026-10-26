import {
  ArrowRight,
  Award,
  Check,
  Clock,
  CreditCard,
  FilePlus,
  Hourglass,
  Lock,
  Printer,
  QrCode,
  ShieldCheck,
  Upload,
  User,
} from 'lucide-react';
import { setRequestLocale } from 'next-intl/server';
import { C, Card, SitePage } from '@/components/site/blocks';
import { Countdown } from '@/components/site/countdown';
import { EndorseSteps, PublicJourney } from '@/components/site/journey';
import { Feed } from '@/components/site/feed';
import { ServiceCards } from '@/components/site/services';
import { Link } from '@/i18n/navigation';
import { asLocale } from '@/i18n/locale';
import { msg } from '@/lib/nav/model';
import { getShell } from '@/lib/shell/server';
import { siteFeed, siteStats } from '@/lib/site/admin';
import { loadLaunchAt, loadPosts, loadServices, postCategory } from '@/lib/site/load';

type Props = { params: Promise<{ locale: string }> };

export const dynamic = 'force-dynamic';

/**
 * Public home (prototype site/home): the MCCI photo under the transparent header with the call to action and the live
 * activity panel, then counters, the membership journey, proposer & seconder, services, temporary → permanent,
 * verify, news, the Urdu launch countdown and a closing call to action. Every figure is real (official members only;
 * demo data excluded); a counter with nothing to count yet is left out.
 */
export default async function HomePage({ params }: Props) {
  const locale = asLocale((await params).locale);
  setRequestLocale(locale);
  const m = (k: string, v?: Record<string, string>) => msg(locale, `site.${k}`, v);
  const [inApp, stats, feed, services, posts, launchAt] = await Promise.all([
    getShell().then((s) => s === 'app'),
    siteStats(),
    siteFeed(7),
    loadServices(),
    loadPosts(3),
    loadLaunchAt(),
  ]);
  const showCountdown = launchAt !== null && Date.parse(launchAt) > Date.now();
  const marquee = [...services.map((s) => (locale === 'ur' ? s.name_ur || s.name_en : s.name_en)), m('marquee.temp'), m('marquee.endorse'), m('marquee.qr'), m('marquee.lang')];
  let n = 0;
  const num = () => String(++n).padStart(2, '0');

  return (
    <SitePage locale={locale}>
      <section className={`xhero home ${inApp ? '!min-h-0 !pt-6 !pb-10' : ''}`}>
        <div className="hero-bg" aria-hidden />
        <div className="hero-ov" aria-hidden />
        <div className="wr xhero-in">
          <div>
            <span className="xpill">
              <Award size={16} color="#f0cd78" aria-hidden /> {m('hero.pill')}
            </span>
            <h1>
              {m('hero.title1')}
              <br />
              <span className="xshine">{m('hero.title2')}</span>
            </h1>
            <p className="xurl" lang="ur" dir="rtl">
              {msg('ur', 'site.hero.ur')}
            </p>
            <p className="xsub">{m('hero.sub')}</p>
            <div className="xcta">
              <Link className="btn btn-gold btn-big" href="/register" data-action="register.start">
                <FilePlus size={18} aria-hidden /> {m('apply')}
              </Link>
              <Link className="btn xglass btn-big" href="/services" data-action="nav">
                {m('explore')} <ArrowRight size={16} aria-hidden className="rtl:rotate-180" />
              </Link>
            </div>
            <div className="xtrust">
              <span>
                <ShieldCheck size={16} color="#7ee0d8" aria-hidden /> {m('hero.trust1')}
              </span>
              <span>
                <Clock size={16} color="#7ee0d8" aria-hidden /> {m('hero.trust2')}
              </span>
              <span>
                <Lock size={16} color="#7ee0d8" aria-hidden /> {m('hero.trust3')}
              </span>
            </div>
          </div>
          <div className="xlive" aria-labelledby="live-h">
            <div className="xlive-h">
              <span className="xpulse" id="live-h">
                {m('live.label')}
              </span>
              <Link href="/live" data-action="nav">
                {m('live.open')} ↗
              </Link>
            </div>
            <Feed locale={locale} rows={feed} services={services} />
            <div className="xlive-f">
              <span>{m('live.anon')}</span>
              <Link href="/track" data-action="nav">
                {m('live.track')} →
              </Link>
            </div>
          </div>
        </div>
        <div className="xwave" aria-hidden />
      </section>

      <div className="xmarq" aria-hidden>
        <div>
          {[...marquee, ...marquee].map((x, i) => (
            <span key={i}>★ {x}</span>
          ))}
        </div>
      </div>

      <section className="xstats" aria-label={m('stats.members')}>
        <div className="wr">
          {stats.members > 0 && (
            <div className="xstat xrv">
              <b data-count={stats.members}>{stats.members.toLocaleString('en-US')}</b>
              <small>{m('stats.members')}</small>
              <span lang="ur">{msg('ur', 'site.stats.members')}</span>
            </div>
          )}
          <div className="xstat xrv">
            <b data-count={services.length}>{services.length}</b>
            <small>{m('stats.services')}</small>
            <span lang="ur">{msg('ur', 'site.stats.services')}</span>
          </div>
          <div className="xstat xrv">
            <b data-count={24} data-suf="h">
              24h
            </b>
            <small>{m('stats.response')}</small>
            <span lang="ur">{msg('ur', 'site.stats.response')}</span>
          </div>
          <div className="xstat xrv">
            <b data-count={60} data-suf={m('stats.days')}>
              60{m('stats.days')}
            </b>
            <small>{m('stats.temp')}</small>
            <span lang="ur">{msg('ur', 'site.stats.temp')}</span>
          </div>
        </div>
      </section>

      <section className="sx" aria-labelledby="jr-h">
        <div className="wr">
          <div className="sh xrv">
            <span className="ey" aria-hidden>
              {num()}
            </span>
            <h2 id="jr-h">{m('journey.title')}</h2>
            <p>{m('journey.sub')}</p>
          </div>
          <div className="xjour xrv">
            <PublicJourney locale={locale} />
            <div className="xjour-bar" aria-hidden>
              <i />
            </div>
          </div>
          <div className="g3" style={{ marginTop: 28 }}>
            <Card icon={Upload} color={C.BL} title={m('journey.upload')} body={m('journey.uploadSub')} />
            <Card icon={Hourglass} color={C.TL} title={m('journey.member')} body={m('journey.memberSub')} />
            <Card icon={Printer} color={C.CB} title={m('journey.print')} body={m('journey.printSub')} />
          </div>
        </div>
      </section>

      <section className="sx xdark" aria-labelledby="en-h">
        <div className="hero-bg" aria-hidden style={{ animation: 'none' }} />
        <div className="hero-ov" aria-hidden />
        <div className="wr">
          <div className="sh xrv">
            <span className="ey" aria-hidden>
              {num()}
            </span>
            <h2 id="en-h">
              {m('endorse.title1')} <span className="xshine">{m('endorse.title2')}</span>
            </h2>
            <p>{m('endorse.sub')}</p>
            {locale === 'en' && (
              <p className="xurl" lang="ur" dir="rtl">
                {msg('ur', 'site.endorse.ur')}
              </p>
            )}
          </div>
          <EndorseSteps locale={locale} />
          <div style={{ textAlign: 'center', marginTop: 30 }}>
            <Link className="btn btn-gold btn-big" href="/register" data-action="register.start">
              {m('endorse.start')} →
            </Link>
          </div>
        </div>
      </section>

      <section className="sx alt" aria-labelledby="sv-h">
        <div className="wr">
          <div className="sh xrv">
            <span className="ey" aria-hidden>
              {num()}
            </span>
            <h2 id="sv-h">{m('services.title')}</h2>
            <p>{m('services.sub')}</p>
          </div>
          <ServiceCards locale={locale} services={services} />
        </div>
      </section>

      <section className="sx" aria-labelledby="tp-h">
        <div className="wr">
          <div className="sh xrv">
            <span className="ey" aria-hidden>
              {num()}
            </span>
            <h2 id="tp-h">{m('temp.title')}</h2>
            <p>{m('temp.sub')}</p>
          </div>
          <div className="xtl">
            {(
              [
                ['s1', CreditCard],
                ['s2', Hourglass],
                ['s3', Printer],
                ['s4', Check],
              ] as const
            ).map(([k, Icon]) => (
              <div className="xtl-s" key={k}>
                <i aria-hidden>
                  <Icon size={24} color="#fff" />
                </i>
                <b>{m(`temp.${k}`)}</b>
                <small>{m(`temp.${k}Sub`)}</small>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="sx alt" aria-labelledby="vf-h">
        <div className="wr">
          <div className="sh xrv">
            <span className="ey" aria-hidden>
              {num()}
            </span>
            <h2 id="vf-h">{m('verify.title')}</h2>
            <p>{m('verify.sub')}</p>
          </div>
          <div className="xver xrv">
            <div className="xqr" aria-hidden>
              <div className="xqr-s" />
              <QrCode size={96} color="#0b2a5b" />
            </div>
            <div>
              <form method="get" action={locale === 'ur' ? '/ur/verify' : '/verify'} className="ask" style={{ margin: 0 }}>
                <QrCode size={22} color={C.GD} aria-hidden />
                <input name="c" placeholder={m('verify.placeholder')} aria-label={m('verify.label')} autoComplete="off" spellCheck={false} required />
                <button type="submit" className="btn btn-primary" data-action="verify.go">
                  {m('verify.go')}
                </button>
              </form>
              <p className="muted" style={{ marginTop: 12 }}>
                {m('verify.help')}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="sx" aria-labelledby="nw-h">
        <div className="wr">
          <div className="sh xrv">
            <span className="ey" aria-hidden>
              {num()}
            </span>
            <h2 id="nw-h">{m('news.title')}</h2>
            <p>{m('news.sub')}</p>
          </div>
          {posts.length ? (
            <div className="g3">
              {posts.map((p) => (
                <Card
                  key={p.id}
                  icon={Award}
                  color={C.GD}
                  title={locale === 'ur' ? p.title_ur || p.title : p.title}
                  body={(locale === 'ur' ? p.body_ur || p.body : p.body).slice(0, 180)}
                  href={`/news?post=${p.id}`}
                  action="post.view"
                  more={p.category ? postCategory(p.category, locale) : undefined}
                />
              ))}
            </div>
          ) : (
            <p className="em" style={{ textAlign: 'center' }}>
              {m('news.none')}
            </p>
          )}
        </div>
      </section>

      {showCountdown && launchAt && (
        <section className="urdu-cd" dir="rtl" lang="ur" aria-labelledby="ur-h">
          <div className="wr" style={{ textAlign: 'center' }}>
            <span className="ey" style={{ color: '#ffe7a3' }}>
              {msg(locale, 'site.urdu.eyebrow')}
            </span>
            <h2 id="ur-h">
              {msg('ur', 'site.urdu.title1')} <span className="g1t">{msg('ur', 'site.urdu.title2')}</span>
            </h2>
            <p className="ur-sub">{msg('ur', 'site.urdu.sub')}</p>
            <p className="ur-tags">
              <span>{msg('ur', 'site.urdu.tag1')}</span>
              <span>{msg('ur', 'site.urdu.tag2')}</span>
              <span>{msg('ur', 'site.urdu.tag3')}</span>
            </p>
            <p className="ur-lbl">{msg('ur', 'site.urdu.left')}</p>
            <Countdown
              at={launchAt}
              labels={{ d: msg('ur', 'site.urdu.d'), h: msg('ur', 'site.urdu.h'), m: msg('ur', 'site.urdu.m'), s: msg('ur', 'site.urdu.s') }}
            />
          </div>
        </section>
      )}

      <section className="xcta2" aria-labelledby="cta-h">
        <div className="wr">
          <div className="xrv">
            <h2 id="cta-h">{m('cta.title')}</h2>
            <p>{m('cta.sub')}</p>
            {locale === 'en' && (
              <p className="xurl" lang="ur" dir="rtl">
                {msg('ur', 'site.cta.ur')}
              </p>
            )}
          </div>
          <div className="xcta">
            <Link className="btn btn-gold btn-big" href="/register" data-action="register.start">
              {m('apply')}
            </Link>
            <Link className="btn xglass btn-big" href="/login" data-action="nav">
              <User size={16} aria-hidden /> {m('memberLogin')}
            </Link>
          </div>
        </div>
      </section>
    </SitePage>
  );
}
