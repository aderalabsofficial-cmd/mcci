import { Search } from 'lucide-react';
import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { asLocale } from '@/i18n/locale';
import { msg } from '@/lib/nav/model';
import { requireUser } from '@/lib/permissions/server';
import { globalSearch, searchTerm } from '@/lib/search/load';

type Props = { params: Promise<{ locale: string }>; searchParams: Promise<{ q?: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return { title: msg(asLocale((await params).locale), 'search.title') };
}

export const dynamic = 'force-dynamic';

/** Global search (top bar search.open): permission-aware, titles and references only */
export default async function SearchPage({ params, searchParams }: Props) {
  const locale = asLocale((await params).locale);
  setRequestLocale(locale);
  const session = await requireUser();
  const q = ((await searchParams).q ?? '').slice(0, 80);
  const hits = q ? await globalSearch(session, q) : [];
  const m = (k: string) => msg(locale, `search.${k}`);
  return (
    <div className="proto">
      <div className="ph">
        <div>
          <h1>{m('title')}</h1>
          <p>{m('sub')}</p>
        </div>
      </div>
      <form
        method="get"
        action={locale === 'ur' ? '/ur/admin/search' : '/admin/search'}
        className="card rep-filter"
        role="search"
      >
        <label className="form-field" style={{ flex: 1 }}>
          {m('label')}
          <input type="search" name="q" defaultValue={q} minLength={2} maxLength={60} required autoFocus />
        </label>
        <button type="submit" className="btn p" data-action="search.go">
          <Search size={16} aria-hidden /> {m('go')}
        </button>
      </form>
      {q && (
        <section className="card" style={{ marginTop: 16 }} aria-live="polite" data-hits={hits.length}>
          {!searchTerm(q) ? (
            <p className="muted">{m('short')}</p>
          ) : hits.length === 0 ? (
            <p className="muted">{m('none')}</p>
          ) : (
            <ul className="opp-list">
              {hits.map((h) => (
                <li key={h.kind + h.ref + h.href} className="opp" data-kind={h.kind}>
                  <span className="bd">{m(`kinds.${h.kind}`)}</span>
                  <Link href={h.href} data-action="search.open">
                    <b>{h.ref}</b> {h.title}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </div>
  );
}
