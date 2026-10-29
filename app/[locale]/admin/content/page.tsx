import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { PostForm } from '@/components/engagement/forms';
import { guardStaff } from '@/components/services/staff-page';
import { asLocale } from '@/i18n/locale';
import { msg } from '@/lib/nav/model';
import { requireUser } from '@/lib/permissions/server';
import { createClient } from '@/lib/supabase/server';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return { title: msg(asLocale((await params).locale), 'eng.content.title') };
}

export const dynamic = 'force-dynamic';

const BADGE: Record<string, string> = { Live: 'green', Draft: 'orange', Archived: 'gray' };

/** Website Content (prototype admin/content): the posts of the public News page, create / edit (eng ≥ 2) */
export default async function AdminContentPage({ params }: Props) {
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
  const rows = data ?? [];
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
    </div>
  );
}
