import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { setRequestLocale } from 'next-intl/server';
import { Journey } from '@/components/membership/ui';
import { PageHero, Section, SitePage } from '@/components/site/blocks';
import { Feed } from '@/components/site/feed';
import { serviceName } from '@/components/site/services';
import { asLocale } from '@/i18n/locale';
import type { Locale } from '@/i18n/routing';
import { voucherDate } from '@/lib/committee/voucher';
import type { AppStage } from '@/lib/membership/reference';
import { trustedClientIp } from '@/lib/net/client-ip';
import { msg } from '@/lib/nav/model';
import { siteFeed, trackToken, type TrackResult } from '@/lib/site/admin';
import { loadServices, type ServiceType } from '@/lib/site/load';

type Props = { params: Promise<{ locale: string }>; searchParams: Promise<{ t?: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return { title: msg(asLocale((await params).locale), 'site.track.title') };
}

export const dynamic = 'force-dynamic';

function Result({ locale, result, services }: { locale: Locale; result: TrackResult; services: ServiceType[] }) {
  const m = (k: string, v?: Record<string, string>) => msg(locale, `site.track.${k}`, v);
  if (result.kind !== 'found') return <p className="em" data-track={result.kind}>{m(result.kind)}</p>;
  const r = result.row;
  const day = (d: string | null) => (d ? voucherDate(d, locale) : '');
  const svc = services.find((s) => s.key === r.kind);
  return (
    <div data-track="found" data-status={r.status}>
      <h3 style={{ fontWeight: 800, fontSize: 18 }}>{r.kind === 'membership' ? m('membership') : svc ? serviceName(svc, locale) : r.kind}</h3>
      <p className="muted">
        {r.token}
        {r.submitted_at ? ` · ${m('submitted', { date: day(r.submitted_at) })}` : ''}
        {r.decided_at ? ` · ${m('decided', { date: day(r.decided_at) })}` : ''}
        {r.due_at && r.status !== 'Issued' ? ` · ${m('due', { date: day(r.due_at) })}` : ''}
      </p>
      {r.kind === 'membership' && (
        <div style={{ marginTop: 14 }}>
          <Journey stage={r.status as AppStage} printing={r.printing} />
        </div>
      )}
      <p style={{ marginTop: 12 }}>
        <span className={`bd ${r.status === 'rejected' || r.status === 'Rejected' ? 'red' : r.status === 'permanent' || r.status === 'Issued' ? 'green' : 'blue'}`}>
          {msg(locale, `site.stage.${r.status}`)}
        </span>
      </p>
    </div>
  );
}

/**
 * Track a token (prototype site/track, action track.go): stage and dates only, never a name; rate-limited per address.
 * Below it, the anonymised live board.
 */
export default async function TrackPage({ params, searchParams }: Props) {
  const locale = asLocale((await params).locale);
  setRequestLocale(locale);
  const m = (k: string) => msg(locale, `site.track.${k}`);
  const token = ((await searchParams).t ?? '').slice(0, 40);
  const [services, feed] = await Promise.all([loadServices(), siteFeed(8)]);
  const result = token ? await trackToken(token, trustedClientIp(await headers()) ?? 'unknown') : null;
  return (
    <SitePage locale={locale}>
      <PageHero locale={locale} title="site.track.title" sub="site.track.sub" />
      <Section n={1} title={m('status')} sub={m('statusSub')} id="status">
        <div className="card" style={{ maxWidth: 900, margin: 'auto' }}>
          <form method="get" action={locale === 'ur' ? '/ur/track' : '/track'} className="ask" style={{ border: '1px solid var(--b)', maxWidth: 'none' }}>
            <input name="t" defaultValue={token} placeholder={m('example')} aria-label={m('label')} autoComplete="off" spellCheck={false} required />
            <button type="submit" className="btn btn-primary" data-action="track.go">
              {m('go')}
            </button>
          </form>
          {result && (
            <div style={{ marginTop: 18 }} aria-live="polite">
              <Result locale={locale} result={result} services={services} />
            </div>
          )}
        </div>
      </Section>
      <Section n={2} title={m('board')} sub={m('boardSub')} alt id="board">
        <div className="card">
          <Feed locale={locale} rows={feed} services={services} />
        </div>
      </Section>
    </SitePage>
  );
}
