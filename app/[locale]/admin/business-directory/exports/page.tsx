import { ArrowLeft } from 'lucide-react';
import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { ExportCentre } from '@/components/business/export-centre';
import { FilterBuilder } from '@/components/business/filter-builder';
import { guardStaff } from '@/components/services/staff-page';
import { Link } from '@/i18n/navigation';
import { asLocale } from '@/i18n/locale';
import { decodeFilter } from '@/lib/business/filters';
import { loadExportLog, loadFacets } from '@/lib/business/load';
import { msg } from '@/lib/nav/model';
import { requireUser } from '@/lib/permissions/server';

type Props = { params: Promise<{ locale: string }>; searchParams: Promise<{ f?: string; q?: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return { title: msg(asLocale((await params).locale), 'screens.admin.bizexports') };
}

export const dynamic = 'force-dynamic';

/** Export centre: staff with Business directory ≥ 2. Sensitive columns need level 3 and a reason; every download is logged. */
export default async function ExportsPage({ params, searchParams }: Props) {
  const locale = asLocale((await params).locale);
  setRequestLocale(locale);
  const session = await requireUser();
  const g = guardStaff(session, locale, 'biz', 'screens.admin.bizexports', 2);
  if (g.denied) return g.denied;
  const m = (k: string) => msg(locale, `biz.exports.${k}`);
  const sp = await searchParams;
  const filter = decodeFilter(sp.f ?? '');
  const q = (sp.q ?? '').slice(0, 100);
  const [facets, log] = await Promise.all([loadFacets(), loadExportLog()]);
  const when = (iso: string) =>
    new Date(iso).toLocaleString(locale === 'ur' ? 'ur-PK' : 'en-GB', {
      timeZone: 'Asia/Karachi',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  return (
    <div className="proto">
      <div className="ph">
        <div>
          <h1>{m('pageTitle')}</h1>
          <p>{m('sub')}</p>
        </div>
        <div className="pb">
          <Link className="btn" href="/admin/business-directory" data-action="biz.back">
            <ArrowLeft size={16} aria-hidden /> {m('back')}
          </Link>
        </div>
      </div>
      <FilterBuilder
        locale={locale}
        basePath="/admin/business-directory/exports"
        facets={facets}
        initial={filter}
        q={q}
        segment={null}
        canSave={false}
      />
      <ExportCentre locale={locale} filter={filter} q={q} level={g.level} />
      <div className="card" data-export-log>
        <div className="ch">
          <h3>{m(g.level >= 3 ? 'logAll' : 'logMine')}</h3>
        </div>
        {log.length === 0 ? (
          <p className="muted">{m('logEmpty')}</p>
        ) : (
          <div className="tw" tabIndex={0} role="region" aria-label={m('logMine')}>
            <table>
              <thead>
                <tr>
                  {(['when', 'who', 'format', 'count', 'fields', 'reason'] as const).map((c) => (
                    <th key={c} scope="col">
                      {m(`logCols.${c}`)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {log.map((e) => (
                  <tr className="st" key={e.id} data-log-format={e.format}>
                    <td>{when(e.at)}</td>
                    <td>{(e.profiles as unknown as { full_name: string | null } | null)?.full_name ?? '—'}</td>
                    <td>{e.format.toUpperCase()}</td>
                    <td>{e.record_count}</td>
                    <td>
                      {e.fields.map((f) => msg(locale, `biz.columns.${f}`)).join(', ')}
                      {e.sensitive && <span className="bd orange">{m('sensitive')}</span>}
                    </td>
                    <td>{e.reason ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
