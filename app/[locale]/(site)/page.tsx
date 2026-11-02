import Image from 'next/image';
import { setRequestLocale } from 'next-intl/server';
import { ComplaintForm } from '@/components/landing/complaint-form';
import { LandingFx } from '@/components/landing/landing-fx';
import { Logo } from '@/components/landing/logo';
import { Countdown } from '@/components/site/countdown';
import { ago } from '@/components/site/feed';
import { LiveRefresh } from '@/components/site/live-refresh';
import { Link } from '@/i18n/navigation';
import { asLocale } from '@/i18n/locale';
import { voucherDate } from '@/lib/committee/voucher';
import { CHAMBER } from '@/lib/chamber';
import { loadPublicSettings } from '@/lib/membership/load';
import { msg } from '@/lib/nav/model';
import { siteFeed, siteStats, type FeedRow } from '@/lib/site/admin';
import { loadEvents, loadLaunchAt, loadPosts, loadServices, postCategory, type ServiceType } from '@/lib/site/load';

type Props = { params: Promise<{ locale: string }> };

export const dynamic = 'force-dynamic';

const IMG = (name: string) => `/images/landing/${name}.jpg`;
const n = (v: number) => v.toLocaleString('en-US');
const pct = (part: number, whole: number) => (whole ? (part / whole) * 100 : 0);

/** the short mark on each service card, as in the design */
const SVC_CODE: Record<string, string> = { co: 'CO', ebil: 'EB', visa: 'VR', guar: 'CN', sample: 'FS', other: 'RL', att: 'DA' };
const NEWS_IMG = ['agm', 'delegation', 'seminar'];

/** the words of the design's 7 service cards exist for these keys; a new service MCCI adds shows its own full name */
const hasCopy = (key: string) => key in SVC_CODE;

const Icon = ({ d }: { d: React.ReactNode }) => <svg viewBox="0 0 24 24" aria-hidden>{d}</svg>;

/** English headline in rising letters; never Urdu, whose letters must join */
function TitleLine({ text, delay, animate }: { text: string; delay: number; animate: boolean }) {
  if (!animate) return <>{text}</>;
  let d = delay;
  const words = text.split(' ');
  return (
    <span className="line" aria-hidden>
      {words.map((word, wi) => (
        <span key={wi}>
          <span style={{ display: 'inline-block', whiteSpace: 'nowrap' }}>
            {word.split('').map((c, ci) => {
              const at = d;
              d += 0.04;
              return (
                <span key={ci} className="ch" style={{ animationDelay: `${at}s` }}>
                  {c}
                </span>
              );
            })}
          </span>
          {wi < words.length - 1 ? ' ' : ''}
        </span>
      ))}
    </span>
  );
}

/**
 * Public home: the owner's front-end design (Nov 2026), wired to the app. The hero's live panel, the member figures
 * and the live desk read api.site_stats / api.site_feed (official members only, demo data excluded); services, fees,
 * news and events come from the same tables as their own pages. A figure the database cannot give is left out, never
 * shown as a sample. Every control is a real route or a real server action.
 */
export default async function HomePage({ params }: Props) {
  const locale = asLocale((await params).locale);
  setRequestLocale(locale);
  const m = (k: string, v?: Record<string, string>) => msg(locale, `landing.${k}`, v);
  const [stats, feed, services, posts, events, settings, launchAt] = await Promise.all([
    siteStats(),
    siteFeed(5),
    loadServices(),
    loadPosts(30),
    loadEvents(),
    loadPublicSettings(),
    loadLaunchAt(),
  ]);
  const showCountdown = launchAt !== null && Date.parse(launchAt) > Date.now();
  const f = settings.fees;
  const fees = [
    { key: 'f1', d: 'f1d', fee: f.Corporate, hi: false },
    { key: 'f2', d: 'f2d', fee: f.Associate, hi: false },
    { key: 'f3', d: 'f3d', fee: f.Women, hi: true },
  ].map((x) => ({ ...x, total: x.fee.admission + x.fee.subscription + x.fee.card }));
  const svcName = (s: ServiceType) => (locale === 'ur' ? s.name_ur || s.name_en : s.name_en);
  const feedName = (r: FeedRow) => {
    if (r.kind === 'membership') return msg(locale, 'site.live.membership');
    const s = services.find((x) => x.key === r.kind);
    return s ? svcName(s) : r.kind;
  };
  const t = (en: string, ur: string | null) => (locale === 'ur' ? ur || en : en);
  const news = posts.filter((p) => p.category !== 'Notice' && p.category !== 'Circular').slice(0, 3);
  const notices = posts.filter((p) => p.category === 'Notice' || p.category === 'Circular').slice(0, 4);
  const upcoming = events.filter((e) => Date.parse(e.starts_at) >= Date.now()).slice(0, 3);
  const karachi = (iso: string, opts: Intl.DateTimeFormatOptions) =>
    new Intl.DateTimeFormat(locale === 'ur' ? 'ur-PK' : 'en-GB', { timeZone: 'Asia/Karachi', ...opts }).format(new Date(iso));
  const latest = feed[0];

  return (
    <div className="lp">
      <LiveRefresh seconds={60} />
      <LandingFx
        cities={{
          london: m('city_london'),
          riyadh: m('city_riyadh'),
          dubai: m('city_dubai'),
          beijing: m('city_beijing'),
          guangzhou: m('city_guangzhou'),
          kl: m('city_kl'),
        }}
        multan={m('city_multan')}
        ur={locale === 'ur'}
      />

      {/* ============ HERO ============ */}
      <section className="hero" id="top">
        <div className="hero-media" aria-hidden>
          <Image src={IMG('multan-aerial')} alt="" fill sizes="100vw" priority />
        </div>
        <canvas className="hero-routes" id="routes" aria-hidden />
        <svg className="hero-star" viewBox="0 0 400 400" aria-hidden>
          <g fill="none" strokeLinejoin="round">
            <path className="draw d1" d="M200 20 L250 130 L380 200 L250 270 L200 380 L150 270 L20 200 L150 130 Z" />
            <path className="draw d2" d="M73 73 L180 120 L327 73 L280 180 L327 327 L220 280 L73 327 L120 220 Z" />
            <circle className="draw d3" cx="200" cy="200" r="62" />
            <circle className="draw d4" cx="200" cy="200" r="150" />
          </g>
        </svg>

        <div className="hero-inner">
          <p className="hero-ur" lang="ur" dir="rtl">
            {msg('ur', 'landing.hero_ur')}
          </p>
          <h1 className="hero-title" aria-label={`${m('hero_1')} ${m('hero_2')}`}>
            <span>
              <TitleLine text={m('hero_1')} delay={0.3} animate={locale === 'en'} />
            </span>
            <span className="ht-2">
              <TitleLine text={m('hero_2')} delay={0.54} animate={locale === 'en'} />
            </span>
          </h1>
          <p className="hero-claim">
            <span className="claim-seal">
              <Logo />
            </span>
            <span className="claim-txt">
              <small>{m('claim_kicker')}</small>
              <strong>{m('claim_main')}</strong>
            </span>
          </p>
          <p className="hero-lead">{m('hero_lead')}</p>
        </div>

        <div className="hero-live" data-live="hero">
          <p className="hl-head">
            <span className="pulse" aria-hidden />
            <span>{m('hl_label')}</span>
          </p>
          <div className="hl-stats">
            <div>
              <span className="hl-num" data-stat="issued" data-count={stats.services_issued}>
                {n(stats.services_issued)}
              </span>
              <span className="hl-lbl">{m('hl_issued')}</span>
            </div>
            <div>
              <span className="hl-num" data-stat="open" data-count={stats.services_open}>
                {n(stats.services_open)}
              </span>
              <span className="hl-lbl">{m('hl_open')}</span>
            </div>
          </div>
          {latest && (
            <p className="hl-last" data-stat="latest">
              {m('hl_last', { service: feedName(latest), when: ago(latest.at, locale) })}
            </p>
          )}
          <Link className="hl-link" href="/live" data-action="nav">
            {m('hl_board')}
          </Link>
        </div>
      </section>

      {/* ============ QUICK ACTIONS (overlap the hero) ============ */}
      <div className="wrap quick">
        <div className="quick-grid">
          <Link className="qa" href="/register" data-action="register.start">
            <span className="qa-ico">
              <Icon d={<><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M19 8v6M22 11h-6" /></>} />
            </span>
            <b>{m('qa1')}</b>
            <span>{m('qa1d')}</span>
          </Link>
          <a className="qa" href="#services">
            <span className="qa-ico">
              <Icon d={<><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6M9 15h6M9 11h3" /></>} />
            </span>
            <b>{m('qa2')}</b>
            <span>{m('qa2d')}</span>
          </a>
          <a className="qa" href="#verify">
            <span className="qa-ico">
              <Icon d={<><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><path d="m9 12 2 2 4-4" /></>} />
            </span>
            <b>{m('qa3')}</b>
            <span>{m('qa3d')}</span>
          </a>
          <Link className="qa" href="/track" data-action="nav">
            <span className="qa-ico">
              <Icon d={<><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>} />
            </span>
            <b>{m('qa4')}</b>
            <span>{m('qa4d')}</span>
          </Link>
          <Link className="qa" href="/directory" data-action="nav">
            <span className="qa-ico">
              <Icon d={<><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></>} />
            </span>
            <b>{m('qa5')}</b>
            <span>{m('qa5d')}</span>
          </Link>
          <a className="qa" href="#complaints">
            <span className="qa-ico">
              <Icon d={<><path d="M21 15a2 2 0 0 1-2 2H8l-5 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /><path d="M8 8h8M8 12h5" /></>} />
            </span>
            <b>{m('qa6')}</b>
            <span>{m('qa6d')}</span>
          </a>
        </div>
      </div>

      {/* ============ ABOUT: PRESIDENT'S MESSAGE ============ */}
      <section className="about" id="about">
        <div className="wrap about-grid">
          <div className="pres-msg">
            <p className="eyebrow">{m('pm_eyebrow')}</p>
            <blockquote className="quote">{m('pm_quote')}</blockquote>
            <p className="pres-by">
              <b>{m('pres_name')}</b>
              <span>{m('pres_role_short')}</span>
            </p>
            <p className="sample-note">{m('pm_sample')}</p>
            <div className="about-links" id="committees">
              <Link className="link-arrow" href="/about#leadership">
                {m('al1')}
              </Link>
            </div>
          </div>
          <div className="bearers-wrap" id="bearers">
            <div className="bearers">
              {(
                [
                  ['president-shafiq-khan-pitafi', 'pres_name', 'role_p', 640, 848],
                  ['svp-azhar-mumtaz-tipu', 'svp_name', 'role_svp', 640, 800],
                  ['vp-abdul-wahab', 'vp_name', 'role_vp', 640, 788],
                ] as const
              ).map(([img, name, role, w, h]) => (
                <div className="person" key={img}>
                  <div className="avatar">
                    <Image src={IMG(img)} alt={m(name)} width={w} height={h} sizes="(max-width: 900px) 33vw, 200px" />
                  </div>
                  <b>{m(name)}</b>
                  <span>{m(role)}</span>
                </div>
              ))}
            </div>
            <div className="vision-card">
              <p className="eyebrow">{m('vision_eyebrow')}</p>
              <p>{m('vision_q')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* ============ WHAT WE DO ============ */}
      <section className="work" id="work">
        <div className="wrap">
          <div className="sec-head">
            <div>
              <p className="eyebrow">{m('work_eyebrow')}</p>
              <h2>{m('work_title')}</h2>
            </div>
          </div>
          <div className="work-grid">
            {(
              [
                ['/about', 'mou-signing', 'w1'],
                ['/news', 'delegation', 'w2'],
                ['/services', 'qr-verify', 'w3'],
                ['/news', 'seminar', 'w4'],
                ['/membership', 'woman-entrepreneur', 'w5'],
                ['/about', 'tech-office', 'w6'],
              ] as const
            ).map(([href, img, k]) => (
              <Link className="wk" href={href} key={k}>
                <Image src={IMG(img)} alt="" fill sizes="(max-width: 560px) 100vw, (max-width: 900px) 50vw, 33vw" />
                <div className="wk-body">
                  <h3>{m(k)}</h3>
                  <p>{m(`${k}d`)}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ============ SLIDER: MULTAN'S TRADE ============ */}
      <section className="slider" id="digital" aria-roledescription="carousel" aria-label={m('sl_label')}>
        <div className="sl-slides" aria-hidden>
          {['delegation', 'dry-port', 'mango-orchard', 'cotton-harvest', 'textile-mill', 'blue-pottery'].map((img, i) => (
            <Image className={`sl ${i === 0 ? 'on' : ''}`} src={IMG(img)} alt="" key={img} fill sizes="100vw" />
          ))}
        </div>
        <div className="wrap sl-inner">
          <p className="eyebrow">{m('sl_eyebrow')}</p>
          <div className="sl-heads" aria-live="polite">
            {(['s1', 's2', 's3', 's4', 's5', 's6'] as const).map((k, i) => (
              <div className={`sl-head ${i === 0 ? 'on' : ''}`} key={k}>
                <h2>{m(k)}</h2>
                <p>{m(`${k}d`)}</p>
              </div>
            ))}
          </div>
          <div className="sl-controls">
            <button className="sl-arrow" type="button" id="slPrev" data-action="slider.prev" aria-label={m('sl_prev')}>
              <svg viewBox="0 0 24 24" aria-hidden><path d="M15 6l-6 6 6 6" /></svg>
            </button>
            <div className="sl-dots" role="tablist" aria-label={m('sl_choose')}>
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <button key={i} type="button" role="tab" data-action="slider.go" aria-selected={i === 1} aria-label={m('sl_n', { n: String(i) })} className={i === 1 ? 'on' : ''}>
                  <i />
                </button>
              ))}
            </div>
            <button className="sl-arrow" type="button" id="slNext" data-action="slider.next" aria-label={m('sl_next')}>
              <svg viewBox="0 0 24 24" aria-hidden><path d="M9 6l6 6-6 6" /></svg>
            </button>
            <span className="sl-count"><b id="slNum">01</b> / 06</span>
          </div>
        </div>
        <div className="wrap sl-points-wrap">
          <div className="sl-points">
            <div className="dg-pt"><b>0</b><span>{m('dg_p1')}</span></div>
            <div className="dg-pt"><b>24h</b><span>{m('dg_p2')}</span></div>
            <div className="dg-pt"><b>100%</b><span>{m('dg_p3')}</span></div>
            <div className="dg-pt"><b>2</b><span>{m('dg_p4')}</span></div>
          </div>
        </div>
      </section>

      {/* ============ MEMBER STATS: left out until the register has members ============ */}
      {stats.members > 0 && (
        <section className="members" id="members">
          <div className="wrap">
            <div className="sec-head">
              <div>
                <p className="eyebrow">{m('mem_eyebrow')}</p>
                <h2>{m('mem_title')}</h2>
              </div>
              <p className="sec-sub">{m('mem_sub')}</p>
            </div>
            <div className="mem-grid">
              <div className="mem mem-total">
                <span className="mem-lbl">{m('mem_total')}</span>
                <b className="mem-num" data-stat="members" data-count={stats.members}>
                  {n(stats.members)}
                </b>
                <div className="mem-stack" aria-hidden>
                  <i className="c" style={{ '--w': `${pct(stats.corporate, stats.members)}%` } as React.CSSProperties} />
                  <i className="a" style={{ '--w': `${pct(stats.associate, stats.members)}%` } as React.CSSProperties} />
                </div>
              </div>
              {(
                [
                  ['mem-c', 'f1', stats.corporate],
                  ['mem-a', 'f2', stats.associate],
                ] as const
              ).map(([cls, k, value]) => (
                <div className={`mem ${cls}`} key={k}>
                  <span className="mem-dot" />
                  <span className="mem-lbl">{m(k)}</span>
                  <b className="mem-num" data-count={value}>
                    {n(value)}
                  </b>
                  <span className="mem-share">
                    <bdi dir="ltr">{pct(value, stats.members).toFixed(1)}%</bdi> {m('mem_of_all')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ============ LIVE SERVICE DESK ============ */}
      <section className="live" id="live">
        <div className="tile-band" aria-hidden />
        <div className="wrap">
          <div className="sec-head">
            <div>
              <p className="eyebrow">
                <span className="pulse" aria-hidden />
                <span>{m('live_eyebrow')}</span>
              </p>
              <h2>{m('live_title')}</h2>
            </div>
            <p className="sec-sub">{m('live_sub')}</p>
          </div>

          <div className="kpis">
            {(
              [
                ['k1', stats.services_issued],
                ['k2', stats.services_open],
                ['k3', stats.applications_open],
                ['k4', stats.members],
              ] as const
            ).map(([k, value]) => (
              <div className="kpi" key={k} data-kpi={k}>
                <span className="kpi-lbl">{m(k)}</span>
                <b className="kpi-num" data-count={value}>
                  {n(value)}
                </b>
              </div>
            ))}
          </div>

          <div className="desk">
            <div className="desk-table">
              <div className="dt-head">
                <span>{m('dt_service')}</span>
                <span>{m('dt_fee')}</span>
                <span>{m('dt_target')}</span>
              </div>
              {services.map((s) => (
                <div className="dt-row" key={s.key} data-ratio={Math.min(1, s.sla_hours / 24)}>
                  <span>{svcName(s)}</span>
                  <b>{n(s.fee)}</b>
                  <span className="dt-bar">
                    <i />
                    <em>{m('dt_hours', { h: String(s.sla_hours) })}</em>
                  </span>
                </div>
              ))}
            </div>
            <div className="desk-feed">
              <p className="feed-title">
                <span className="pulse" aria-hidden />
                <span>{m('feed_title')}</span>
              </p>
              {feed.length ? (
                <ul className="feed" id="feed">
                  {feed.map((r) => (
                    <li key={r.token}>
                      <span className="tok" dir="ltr">{r.token}</span>
                      <span className="tm">{ago(r.at, locale)}</span>
                      <span className="sv">
                        {feedName(r)} · {msg(locale, `site.stage.${r.status}`)}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="feed-empty">{m('feed_none')}</p>
              )}
              <p className="feed-note">{m('feed_note')}</p>
            </div>
          </div>
          <div className="desk-link">
            <Link className="link-arrow" href="/live" data-action="nav">
              {m('hl_board')}
            </Link>
          </div>
        </div>
      </section>

      {/* ============ SERVICES ============ */}
      <section className="services" id="services">
        <div className="wrap">
          <div className="sec-head">
            <div>
              <p className="eyebrow">{m('svc_eyebrow')}</p>
              <h2>{m('svc_title')}</h2>
            </div>
            <p className="sec-sub">{m('svc_sub')}</p>
          </div>
          <div className="svc-grid">
            {services.map((s) => (
              <Link className="svc" id={`svc-${s.key}`} key={s.key} href={`/service?s=${s.key}`}>
                <span className="svc-ico">{SVC_CODE[s.key] ?? s.key.slice(0, 2).toUpperCase()}</span>
                <h3>{svcName(s)}</h3>
                <p>{hasCopy(s.key) ? m(`svc_${s.key}_d`) : s.full_name_en}</p>
                <span className="svc-go">{m('apply')}</span>
              </Link>
            ))}
            <Link className="svc svc-track" href="/track" data-action="nav">
              <span className="svc-ico">#</span>
              <h3>{m('track')}</h3>
              <p>{m('track_d')}</p>
              <span className="svc-go">{m('track_go')}</span>
            </Link>
          </div>

          <form className="verify" id="verify" method="get" action={locale === 'ur' ? '/ur/verify' : '/verify'}>
            <div className="verify-txt">
              <h3>{m('verify_title')}</h3>
              <p>{m('verify_sub')}</p>
            </div>
            <div className="verify-field">
              <label className="sr" htmlFor="vcode">
                {msg(locale, 'site.verify.label')}
              </label>
              <input id="vcode" name="c" dir="ltr" placeholder={msg(locale, 'site.verify.placeholder')} autoComplete="off" spellCheck={false} required />
              <button className="btn btn-green" type="submit" data-action="verify.go">
                {m('verify_btn')}
              </button>
            </div>
          </form>
        </div>
      </section>

      {/* ============ MEMBERSHIP ============ */}
      <section className="join" id="join">
        <div className="join-media" aria-hidden>
          <Image src={IMG('chamber-building')} alt="" fill sizes="100vw" />
        </div>
        <div className="wrap join-inner">
          <div className="join-txt">
            <p className="eyebrow">{m('join_eyebrow')}</p>
            <h2>{m('join_title')}</h2>
            <p>{m('join_p')}</p>
            <div className="join-ctas">
              <Link className="btn btn-green" href="/register" data-action="register.start">
                <span>{m('join_cta')}</span>
                <svg viewBox="0 0 24 24" aria-hidden><path d="M5 12h14M13 6l6 6-6 6" /></svg>
              </Link>
              <Link className="btn btn-glass" href="/membership" data-action="nav">
                {m('join_req')}
              </Link>
            </div>
          </div>
          <div className="fees" id="classes">
            {fees.map((x) => (
              <div className={`fee ${x.hi ? 'fee-hi' : ''}`} key={x.key}>
                <span>{m(x.key)}</span>
                <b>
                  <small>{m('rs')}</small> {n(x.total)}
                </b>
                <em>{m(x.d)}</em>
              </div>
            ))}
            <div className="fee-table" id="fee-table">
              <div className="ft-scroll">
                <table>
                  <thead>
                    <tr>
                      <th>{m('ft_class')}</th>
                      <th>{m('ft_adm')}</th>
                      <th>{m('ft_ann')}</th>
                      <th>{m('ft_card')}</th>
                      <th>{m('ft_total')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {fees.map((x) => (
                      <tr key={x.key}>
                        <td>{m(x.key)}</td>
                        <td>{n(x.fee.admission)}</td>
                        <td>{n(x.fee.subscription)}</td>
                        <td>{n(x.fee.card)}</td>
                        <td><b>{n(x.total)}</b></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="fee-note">{m('fee_note', { extra: n(f.extraCard) })}</p>
            </div>
          </div>
        </div>
      </section>

      {/* ============ NEWS, NOTICES, EVENTS ============ */}
      <section className="news" id="news">
        <div className="wrap">
          <div className="sec-head">
            <div>
              <p className="eyebrow">{m('news_eyebrow')}</p>
              <h2>{m('news_title')}</h2>
            </div>
            <Link className="link-arrow" href="/news" data-action="nav">
              {m('news_all')}
            </Link>
          </div>
          {news.length ? (
            <div className="news-grid">
              {news.map((p, i) => (
                <Link className={`nw ${i === 0 ? 'nw-lg' : ''}`} href={`/news?post=${p.id}`} key={p.id} data-action="post.view">
                  <Image src={IMG(NEWS_IMG[i]!)} alt="" fill sizes="(max-width: 900px) 100vw, 40vw" />
                  <div>
                    {p.published_at && <time dateTime={p.published_at}>{voucherDate(p.published_at, locale)}</time>}
                    <h3>{t(p.title, p.title_ur)}</h3>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="news-empty">{msg(locale, 'site.news.none')}</p>
          )}

          <div className="boards">
            <div className="board">
              <h3>{m('notices_title')}</h3>
              {notices.length ? (
                notices.map((p) => (
                  <Link className="doc" href={`/news?post=${p.id}`} key={p.id} data-action="post.view">
                    <i>{p.category ? postCategory(p.category, locale) : ''}</i>
                    <span>{t(p.title, p.title_ur)}</span>
                  </Link>
                ))
              ) : (
                <p className="board-empty">{m('notices_none')}</p>
              )}
            </div>
            <div className="board">
              <h3>{m('events_title')}</h3>
              {upcoming.length ? (
                upcoming.map((e) => (
                  <div className="event" key={e.id}>
                    <div className="date">
                      <b>{karachi(e.starts_at, { day: '2-digit' })}</b>
                      <span>{karachi(e.starts_at, { month: 'short' })}</span>
                    </div>
                    <div>
                      <b>{t(e.title, e.title_ur)}</b>
                      {(e.venue || e.body) && <p>{e.venue || t(e.body!, e.body_ur)}</p>}
                    </div>
                  </div>
                ))
              ) : (
                <p className="board-empty">{m('events_none')}</p>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ============ URDU LAUNCH COUNTDOWN (settings.site.launchAt) ============ */}
      {showCountdown && launchAt && (
        <div className="proto site">
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
        </div>
      )}

      {/* ============ CONTACT, COMPLAINTS & SUGGESTIONS ============ */}
      <section className="contact" id="contact">
        <div className="wrap">
          <div className="sec-head">
            <div>
              <p className="eyebrow">{m('ct_eyebrow')}</p>
              <h2>{m('ct_title')}</h2>
            </div>
            <p className="sec-sub">{m('ct_sub')}</p>
          </div>
          <div className="contact-grid">
            <div className="contact-info">
              <div className="ci">
                <span className="ci-ico">
                  <Icon d={<><path d="M12 22s7-6.2 7-12a7 7 0 1 0-14 0c0 5.8 7 12 7 12z" /><circle cx="12" cy="10" r="2.5" /></>} />
                </span>
                <div>
                  <b>{m('ct_addr')}</b>
                  <p>{m('ct_addr_v')}</p>
                </div>
              </div>
              <div className="ci">
                <span className="ci-ico">
                  <Icon d={<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.100 9.900a16 16 0 0 0 6 6l1.300-1.300a2 2 0 0 1 2.100-.4c.9.300 1.800.6 2.800.7a2 2 0 0 1 1.700 2z" />} />
                </span>
                <div>
                  <b>{m('ct_phone')}</b>
                  <p dir="ltr" className="ci-ltr">
                    <a href="tel:+92614543530">061-4543530</a>, <a href="tel:+92614517087">061-4517087</a>
                  </p>
                </div>
              </div>
              <div className="ci">
                <span className="ci-ico">
                  <Icon d={<><rect x="2" y="4" width="20" height="16" rx="2" /><path d="m22 7-10 7L2 7" /></>} />
                </span>
                <div>
                  <b>{m('ct_email')}</b>
                  <p dir="ltr" className="ci-ltr">
                    <a href={`mailto:${CHAMBER.email}`}>{CHAMBER.email}</a>
                  </p>
                </div>
              </div>
              <div className="ci">
                <span className="ci-ico">
                  <Icon d={<><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>} />
                </span>
                <div>
                  <b>{m('menu_hours')}</b>
                  <p>{m('hours_wk')}</p>
                  <p>{m('hours_sat')}</p>
                </div>
              </div>
            </div>
            <ComplaintForm locale={locale} />
          </div>
        </div>
      </section>
    </div>
  );
}
