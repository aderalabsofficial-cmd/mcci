import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { asLocale } from '@/i18n/locale';
import { msg } from '@/lib/nav/model';
import { requireUser } from '@/lib/permissions/server';
import { loadQueue } from '@/lib/queue/load';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return { title: msg(asLocale((await params).locale), 'queue.title') };
}

export const dynamic = 'force-dynamic';

/** My queue (admin bottom bar; Android app): what waits for this staff member, within their own limits */
export default async function QueuePage({ params }: Props) {
  const locale = asLocale((await params).locale);
  setRequestLocale(locale);
  const session = await requireUser();
  const groups = await loadQueue(session);
  const m = (k: string) => msg(locale, `queue.${k}`);
  const when = (iso: string | null) =>
    iso
      ? new Date(iso).toLocaleDateString(locale === 'ur' ? 'ur-PK' : 'en-GB', {
          timeZone: 'Asia/Karachi',
          day: 'numeric',
          month: 'short',
        })
      : '';
  return (
    <div className="proto">
      <div className="ph">
        <div>
          <h1>{m('title')}</h1>
          <p>{m('sub')}</p>
        </div>
      </div>
      <div className="gr rep-grid">
        {groups.map((g) => (
          <section key={g.key} className="card" aria-labelledby={`q-${g.key}`} data-queue={g.key} id={g.key}>
            <div className="ch">
              <h3 id={`q-${g.key}`}>
                {m(`groups.${g.key}`)} <span className="bd">{g.count}</span>
              </h3>
            </div>
            {g.items.length === 0 ? (
              <p className="muted">{m('empty')}</p>
            ) : (
              <ul className="opp-list">
                {g.items.map((it, i) => (
                  <li key={`${it.ref}-${i}`} className="opp">
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <Link href={it.href} data-action="queue.open">
                        <b>
                          {it.ref ? `${it.ref} · ` : ''}
                          {it.title}
                        </b>
                      </Link>
                      <small className="muted" style={{ display: 'block' }}>
                        {it.status} {when(it.at)}
                      </small>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        ))}
      </div>
    </div>
  );
}
