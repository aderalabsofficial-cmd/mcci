import { setRequestLocale } from 'next-intl/server';
import { ago } from '@/components/site/feed';
import { LiveRefresh } from '@/components/site/live-refresh';
import { HomeMain } from '@/components/web/gen/index.gen';
import { webProps } from '@/components/web/props';
import { Link } from '@/i18n/navigation';
import { asLocale } from '@/i18n/locale';
import { loadPublicSettings } from '@/lib/membership/load';
import { msg } from '@/lib/nav/model';
import { siteFeed, siteStats, type FeedRow } from '@/lib/site/admin';
import { loadEvents, loadServices, type ServiceType } from '@/lib/site/load';
import { readOr } from '@/lib/site/read-or';

type Props = { params: Promise<{ locale: string }> };

export const dynamic = 'force-dynamic';

const n = (v: number) => v.toLocaleString('en-US');
const pct = (part: number, whole: number) => (whole ? (part / whole) * 100 : 0);

/** the short mark on each service card, as in the design */
const SVC_CODE: Record<string, string> = {
  co: 'CO',
  ebil: 'EB',
  visa: 'VR',
  guar: 'CN',
  sample: 'FS',
  other: 'RL',
  att: 'DA',
};

/** the words of the design's 7 service cards exist for these keys; a new service MCCI adds shows its own full name */
const hasCopy = (key: string) => key in SVC_CODE;

/**
 * Public home: the owner's front-end design (Nov 2026), wired to the app. The hero's live panel, the member figures
 * and the live desk read api.site_stats / api.site_feed (official members only, demo data excluded); services, fees,
 * news and events come from the same tables as their own pages. A figure the database cannot give is left out, never
 * shown as a sample. Every control is a real route or a real server action. A read that fails costs only its own
 * section, which says so and fills in again at the next refresh; the rest of the page still opens.
 */
export default async function HomePage({ params }: Props) {
  const locale = asLocale((await params).locale);
  setRequestLocale(locale);
  const m = (k: string, v?: Record<string, string>) => msg(locale, `landing.${k}`, v);
  const [stats, feed, services, events, settings] = await Promise.all([
    siteStats(),
    siteFeed(5),
    readOr('services', loadServices()),
    readOr('events', loadEvents()),
    readOr('settings', loadPublicSettings()),
  ]);
  const f = settings?.fees;
  const fees = f
    ? [
        { key: 'f1', d: 'f1d', fee: f.Corporate, hi: false },
        { key: 'f2', d: 'f2d', fee: f.Associate, hi: false },
        { key: 'f3', d: 'f3d', fee: f.Women, hi: true },
      ].map((x) => ({ ...x, total: x.fee.admission + x.fee.subscription + x.fee.card }))
    : null;
  const svcName = (s: ServiceType) => (locale === 'ur' ? s.name_ur || s.name_en : s.name_en);
  const feedName = (r: FeedRow) => {
    if (r.kind === 'membership') return msg(locale, 'site.live.membership');
    const s = services?.find((x) => x.key === r.kind);
    if (s) return svcName(s);
    return hasCopy(r.kind) ? m(`svc_${r.kind}`) : r.kind;
  };
  const t = (en: string, ur: string | null) => (locale === 'ur' ? ur || en : en);
  const upcoming = events?.filter((e) => Date.parse(e.starts_at) >= Date.now()).slice(0, 3) ?? [];
  const unavailable = (
    <p className="read-failed" role="status" data-read-failed>
      {m('read_failed')}
    </p>
  );
  const karachi = (iso: string, opts: Intl.DateTimeFormatOptions) =>
    new Intl.DateTimeFormat(locale === 'ur' ? 'ur-PK' : 'en-GB', { timeZone: 'Asia/Karachi', ...opts }).format(
      new Date(iso),
    );
  const latest = feed?.[0];

  return (
    <>
      <LiveRefresh seconds={60} />
      <HomeMain
        {...webProps(locale, {
          heroLive: (
            <div className="hero-live" data-live="hero">
              <p className="hl-head">
                <span className="pulse" aria-hidden />
                <span>{m('hl_label')}</span>
              </p>
              {stats ? (
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
              ) : (
                unavailable
              )}
              {latest && (
                <p className="hl-last" data-stat="latest">
                  {m('hl_last', { service: feedName(latest), when: ago(latest.at, locale) })}
                </p>
              )}
              <Link className="hl-link" href="/live" data-action="nav">
                {m('hl_board')}
              </Link>
            </div>
          ),
          members: (
            <>
              {stats && stats.members > 0 && (
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
                          <i
                            className="c"
                            style={{ '--w': `${pct(stats.corporate, stats.members)}%` } as React.CSSProperties}
                          />
                          <i
                            className="a"
                            style={{ '--w': `${pct(stats.associate, stats.members)}%` } as React.CSSProperties}
                          />
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
            </>
          ),
          live: (
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

                {stats ? (
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
                ) : (
                  unavailable
                )}

                <div className="desk">
                  <div className="desk-table">
                    <div className="dt-head">
                      <span>{m('dt_service')}</span>
                      <span>{m('dt_fee')}</span>
                      <span>{m('dt_target')}</span>
                    </div>
                    {!services && unavailable}
                    {services?.map((s) => (
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
                    {!feed ? (
                      unavailable
                    ) : feed.length ? (
                      <ul className="feed" id="feed">
                        {feed.map((r) => (
                          <li key={r.token}>
                            <span className="tok" dir="ltr">
                              {r.token}
                            </span>
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
          ),
          services: (
            <section className="services" id="services">
              <div className="wrap">
                <div className="sec-head">
                  <div>
                    <p className="eyebrow">{m('svc_eyebrow')}</p>
                    <h2>{m('svc_title')}</h2>
                  </div>
                  <p className="sec-sub">{m('svc_sub')}</p>
                </div>
                {!services && unavailable}
                <div className="svc-grid">
                  {services?.map((s) => (
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
                    <input
                      id="vcode"
                      name="c"
                      dir="ltr"
                      placeholder={msg(locale, 'site.verify.placeholder')}
                      autoComplete="off"
                      spellCheck={false}
                      required
                    />
                    <button className="btn btn-green" type="submit" data-action="verify.go">
                      {m('verify_btn')}
                    </button>
                  </div>
                </form>
              </div>
            </section>
          ),
          fees: (
            <div className="fees" id="classes">
              {!fees && unavailable}
              {fees?.map((x) => (
                <Link
                  className={`fee ${x.hi ? 'fee-hi' : ''}`}
                  key={x.key}
                  href="/membership#classes"
                  data-action="nav"
                >
                  <span>{m(x.key)}</span>
                  <b>
                    <small>{m('rs')}</small> {n(x.total)}
                  </b>
                  <em>{m(x.d)}</em>
                </Link>
              ))}
              {fees && <p className="fee-note">{m('fee_note_home')}</p>}
            </div>
          ),
          events: (
            <div className="board events-board" data-board="events">
              <h3>{m('events_title')}</h3>
              {!events ? (
                unavailable
              ) : upcoming.length ? (
                upcoming.map((e) => (
                  <Link className="ev" key={e.id} href="/news#events" data-action="nav">
                    <span className="ev-date">
                      <b>{karachi(e.starts_at, { day: '2-digit' })}</b>
                      <span>{karachi(e.starts_at, { month: 'short' })}</span>
                    </span>
                    <span>
                      <b>{t(e.title, e.title_ur)}</b>
                      {(e.venue || e.body) && <small>{e.venue || t(e.body!, e.body_ur)}</small>}
                    </span>
                  </Link>
                ))
              ) : (
                <p className="board-empty">{m('events_none')}</p>
              )}
              {/* the design asked for event updates by SMS; MCCI has no SMS service, so members choose WhatsApp updates instead */}
              <Link className="btn btn-green ev-wa" href="/portal/whatsapp" data-action="nav">
                {m('ev_whatsapp')}
              </Link>
            </div>
          ),
        })}
      />
    </>
  );
}
