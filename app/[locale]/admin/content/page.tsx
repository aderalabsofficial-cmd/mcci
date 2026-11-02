import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { PostForm } from '@/components/engagement/forms';
import { OpportunityDesk } from '@/components/engagement/opportunities';
import { guardStaff } from '@/components/services/staff-page';
import { Link } from '@/i18n/navigation';
import { asLocale } from '@/i18n/locale';
import type { ContentMediaRow } from '@/lib/content/media';
import { msg } from '@/lib/nav/model';
import { requireUser } from '@/lib/permissions/server';
import { loadOpportunities } from '@/lib/opportunities/load';
import { createClient } from '@/lib/supabase/server';

type Props = { params: Promise<{ locale: string }>; searchParams: Promise<{ channel?: string }> };

const CHANNELS = ['all', 'News', 'Notice', 'Circular', 'Event'] as const;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return { title: msg(asLocale((await params).locale), 'eng.content.title') };
}

export const dynamic = 'force-dynamic';

const BADGE: Record<string, string> = { Live: 'green', Draft: 'orange', Archived: 'gray' };

/** Website Content (prototype admin/content): the posts of the public News page, create / edit (eng ≥ 2) */
export default async function AdminContentPage({ params, searchParams }: Props) {
  const locale = asLocale((await params).locale);
  setRequestLocale(locale);
  const session = await requireUser();
  const g = guardStaff(session, locale, 'eng', 'eng.content.title');
  if (g.denied) return g.denied;
  const m = (k: string, v?: Record<string, string>) => msg(locale, `eng.content.${k}`, v);
  const supabase = await createClient();
  const { data } = await supabase
    .from('posts')
    .select('id, category, title, title_ur, body, body_ur, status, published_at')
    .order('published_at', { ascending: false, nullsFirst: true });
  const all = data ?? [];
  const sp = await searchParams;
  const channel = (CHANNELS as readonly string[]).includes(sp.channel ?? '') ? sp.channel! : 'all';
  const rows = channel === 'all' ? all : all.filter((p) => (p.category ?? 'News') === channel);
  const { data: mediaRows } = await supabase.from('content_media').select('id, post_id, kind, path, file_name, caption').not('post_id', 'is', null).order('sort');
  const mediaOf = (id: string) => (mediaRows ?? []).filter((x) => x.post_id === id) as ContentMediaRow[];
  const opps = (await loadOpportunities(locale)).all;
  const OPP_KEYS = [
    'desk',
    'share',
    'waiting',
    'noneWaiting',
    'published',
    'noneOpen',
    'publish',
    'reject',
    'reason',
    'reasonNeeded',
    'close',
    'title',
    'details',
    'sector',
    'market',
    'days',
    'submit',
    'until',
    'interested',
    'noRight',
  ];
  const canEdit = g.level >= 2;
  const date = (iso: string | null) =>
    iso
      ? new Date(iso).toLocaleDateString(locale === 'ur' ? 'ur-PK' : 'en-GB', {
          timeZone: 'Asia/Karachi',
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        })
      : '—';
  return (
    <div className="proto">
      <div className="ph">
        <div>
          <h1>{m('title')}</h1>
        </div>
        <div className="pb">{canEdit && <PostForm locale={locale} />}</div>
      </div>
      <section className="card" aria-labelledby="po-h">
        <div className="ch">
          <h3 id="po-h">{m('table')}</h3>
        </div>
        <nav className="pills" aria-label={m('channels')}>
          {CHANNELS.map((c) => (
            <Link
              key={c}
              href={c === 'all' ? '/admin/content' : `/admin/content?channel=${c}`}
              className={`pill ${channel === c ? 'on' : ''}`}
              aria-current={channel === c ? 'true' : undefined}
              data-action="content.channel"
              data-channel={c}
            >
              {c === 'all' ? m('allChannels') : msg(locale, `site.news.categories.${c}`)} ({c === 'all' ? all.length : all.filter((p) => (p.category ?? 'News') === c).length})
            </Link>
          ))}
        </nav>
        {rows.length ? (
          <div className="tw" tabIndex={0} role="region" aria-label={m('table')}>
            <table>
              <thead>
                <tr>
                  {(['title', 'type', 'updated', 'status'] as const).map((c) => (
                    <th key={c} scope="col">
                      {m(`cols.${c}`)}
                    </th>
                  ))}
                  {canEdit && (
                    <th scope="col">
                      <span className="sr-only">{m('edit', { title: '' })}</span>
                    </th>
                  )}
                </tr>
              </thead>
              <tbody>
                {rows.map((p) => (
                  <tr className="st" key={p.id} data-post={p.id}>
                    <td>
                      <b>{locale === 'ur' && p.title_ur ? p.title_ur : p.title}</b>
                      {mediaOf(p.id).length > 0 && <small className="muted block">{m('mediaCount', { n: String(mediaOf(p.id).length) })}</small>}
                    </td>
                    <td>{msg(locale, `site.news.categories.${p.category ?? 'News'}`)}</td>
                    <td>{date(p.published_at)}</td>
                    <td>
                      <span className={`bd ${BADGE[p.status] ?? 'gray'}`}>{m(`statuses.${p.status}`)}</span>
                    </td>
                    {canEdit && (
                      <td>
                        <PostForm
                          locale={locale}
                          media={mediaOf(p.id)}
                          post={{
                            id: p.id,
                            category: p.category ?? 'News',
                            title: p.title,
                            title_ur: p.title_ur ?? '',
                            body: p.body ?? '',
                            body_ur: p.body_ur ?? '',
                            status: p.status,
                          }}
                        />
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="em">{m('none')}</p>
        )}
      </section>
      <OpportunityDesk
        locale={locale}
        canEdit={canEdit}
        pending={opps.filter((x) => x.raw.status === 'Pending').map((x) => x.opp)}
        open={opps.filter((x) => x.open).map((x) => x.opp)}
        t={Object.fromEntries(OPP_KEYS.map((k) => [k, msg(locale, `opp.${k}`)]))}
      />
    </div>
  );
}
