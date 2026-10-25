import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { HomeNext } from '@/components/membership/home-next';
import { both, Card, Journey, L, Timeline } from '@/components/membership/ui';
import { asLocale } from '@/i18n/locale';
import { loadMyApplication } from '@/lib/membership/load';
import { msg } from '@/lib/nav/model';
import { createClient } from '@/lib/supabase/server';

type Props = { params: Promise<{ locale: string }>; searchParams: Promise<{ submitted?: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return { title: msg(asLocale((await params).locale), 'screens.portal.mtrack') };
}

const when = (iso: string, locale: string) =>
  new Date(iso).toLocaleString(locale === 'ur' ? 'ur-PK' : 'en-GB', {
    timeZone: 'Asia/Karachi',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

/** Track (prototype member/mtrack): large 8-step tracker, full history with who/when, messages received. */
export default async function TrackPage({ params, searchParams }: Props) {
  const locale = asLocale((await params).locale);
  setRequestLocale(locale);
  const [app, sp] = await Promise.all([loadMyApplication(), searchParams]);
  const m = (k: string, v?: Record<string, string>) => msg(locale, `membership.${k}`, v);
  const supabase = await createClient();
  const { data: notes } = await supabase
    .from('notifications')
    .select('id, title, body, created_at')
    .order('created_at', { ascending: false })
    .limit(20);
  // steps written by later milestones may not have a label yet: show them as recorded
  const stepLabel = (step: string) => {
    try {
      return msg(locale, `membership.track.steps.${step}`);
    } catch {
      return step;
    }
  };

  return (
    <>
      <div className="ph">
        <div>
          <h1>
            <L {...both('membership.track.title')} />
          </h1>
          {app && <p>{app.token}</p>}
        </div>
      </div>
      {sp.submitted && app && (
        <div className="banner green" role="status" style={{ marginBottom: 14 }}>
          <span>{m('track.submittedBanner', { token: app.token })}</span>
        </div>
      )}
      <HomeNext app={app} locale={locale} />
      {app && app.stage !== 'draft' && app.stage !== 'withdrawn' && (
        <div className="card" style={{ marginBottom: 18 }}>
          <div className="ch">
            <h3>
              <L {...both('membership.track.progress')} />
            </h3>
          </div>
          <Journey stage={app.stage} big />
        </div>
      )}
      <div className="gr" style={{ gridTemplateColumns: '1fr 1fr' }}>
        <Card title={<L {...both('membership.track.history')} />}>
          {app?.history.length ? (
            <Timeline
              items={app.history.map((h, i) => ({
                title: stepLabel(h.step),
                sub: `${when(h.at, locale)}${h.by_name ? ` · ${m('track.by', { name: h.by_name })}` : ''}${h.note ? ` · ${h.note}` : ''}`,
                state: i === 0 ? 'n' : 'd',
              }))}
            />
          ) : (
            <p className="muted">{m('track.none')}</p>
          )}
        </Card>
        <Card title={<L {...both('membership.track.messages')} />}>
          {notes?.length ? (
            notes.map((n) => (
              <div className="li st" key={n.id}>
                <div>
                  <b>{n.title}</b>
                  <small>{n.body}</small>
                </div>
                <span>{when(n.created_at, locale)}</span>
              </div>
            ))
          ) : (
            <p className="muted">{m('home.nothing')}</p>
          )}
        </Card>
      </div>
    </>
  );
}
