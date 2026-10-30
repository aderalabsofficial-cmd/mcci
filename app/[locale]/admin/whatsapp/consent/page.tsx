import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { guardStaff } from '@/components/services/staff-page';
import { Link } from '@/i18n/navigation';
import { asLocale } from '@/i18n/locale';
import { msg } from '@/lib/nav/model';
import { requireUser } from '@/lib/permissions/server';
import { loadSuppressions } from '@/lib/whatsapp/load';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return { title: msg(asLocale((await params).locale), 'screens.admin.waconsent') };
}

export const dynamic = 'force-dynamic';

/** Who has agreed to what, and which numbers must not be contacted. Changes are made on each business profile. */
export default async function ConsentPage({ params }: Props) {
  const locale = asLocale((await params).locale);
  setRequestLocale(locale);
  const session = await requireUser();
  const g = guardStaff(session, locale, 'out', 'screens.admin.waconsent', 2);
  if (g.denied) return g.denied;
  const m = (k: string) => msg(locale, `wa.consent.${k}`);
  const { numbers, suppressions } = await loadSuppressions();
  const date = (iso: string | null) =>
    iso
      ? new Date(iso).toLocaleDateString(locale === 'ur' ? 'ur-PK' : 'en-GB', {
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
          <p>{m('sub')}</p>
        </div>
      </div>
      <div className="card" data-consent-numbers={numbers.length}>
        <div className="ch">
          <h3>{m('numbers')}</h3>
        </div>
        {numbers.length === 0 ? (
          <p className="muted">{m('noNumbers')}</p>
        ) : (
          <div className="tw" tabIndex={0} role="region" aria-label={m('numbers')}>
            <table>
              <thead>
                <tr>
                  {(['business', 'number', 'consent', 'categories', 'date', 'version'] as const).map((c) => (
                    <th key={c} scope="col">
                      {m(`cols.${c}`)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {numbers.map((n) => (
                  <tr className="st" key={n.member_id}>
                    <td>
                      <Link
                        className="rowlink"
                        href={`/admin/business-directory/profile?id=${n.member_id}`}
                        data-action="biz.profile.open"
                      >
                        {n.business_name} ({n.member_no})
                      </Link>
                    </td>
                    <td dir="ltr">{n.phone}</td>
                    <td>
                      {n.opted_out ? (
                        <span className="bd red">{msg(locale, 'biz.profile.optedOut')}</span>
                      ) : (
                        msg(locale, `biz.values.consent.${n.consent}`)
                      )}
                    </td>
                    <td>{(n.categories ?? []).map((c) => msg(locale, `wa.categories.${c}`)).join(', ') || '—'}</td>
                    <td>{date(n.at)}</td>
                    <td>{n.version ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <div className="card" data-suppressions={suppressions.length}>
        <div className="ch">
          <h3>{m('suppressions')}</h3>
        </div>
        {suppressions.length === 0 ? (
          <p className="muted">{m('noSuppressions')}</p>
        ) : (
          <ul className="biz-history">
            {suppressions.map((s) => (
              <li key={s.phone}>
                <b dir="ltr">{s.phone}</b> · {date(s.created_at)} · {s.reason} ({m(`sources.${s.source}`)})
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
