import { Database, Download, Layers } from 'lucide-react';
import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { DirectoryTable } from '@/components/business/directory-table';
import { FilterBuilder } from '@/components/business/filter-builder';
import { guardStaff } from '@/components/services/staff-page';
import { Link } from '@/i18n/navigation';
import { asLocale } from '@/i18n/locale';
import { decodeFilter, directoryQuery } from '@/lib/business/filters';
import { loadDuplicates, loadFacets, loadSegments, searchDirectory } from '@/lib/business/load';
import { msg } from '@/lib/nav/model';
import { staffLevel } from '@/lib/permissions/levels';
import { requireUser } from '@/lib/permissions/server';

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ f?: string; q?: string; sort?: string; dir?: string; page?: string; segment?: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return { title: msg(asLocale((await params).locale), 'screens.admin.bizdir') };
}

export const dynamic = 'force-dynamic';

const SIZE = 25;

/** Business Directory (docs/29): the official members, searchable and filterable. Reads only; official data is not edited here. */
export default async function BusinessDirectoryPage({ params, searchParams }: Props) {
  const locale = asLocale((await params).locale);
  setRequestLocale(locale);
  const session = await requireUser();
  const g = guardStaff(session, locale, 'biz', 'screens.admin.bizdir');
  if (g.denied) return g.denied;
  const m = (k: string) => msg(locale, `biz.directory.${k}`);
  const sp = await searchParams;
  const segments = await loadSegments();
  const open = sp.segment ? segments.find((s) => s.id === sp.segment) : undefined;
  const filter = decodeFilter(sp.f ?? (open ? open.definition : ''));
  const q = (sp.q ?? '').slice(0, 100);
  const sort = sp.sort ?? 'business_name';
  const dir = sp.dir === 'desc' ? 'desc' : 'asc';
  const page = Math.max(1, Math.min(100000, Number(sp.page) || 1));
  const [facets, result, duplicates] = await Promise.all([
    loadFacets(),
    searchDirectory(filter, q, sort, dir, page, SIZE),
    g.level >= 2 ? loadDuplicates() : Promise.resolve([]),
  ]);
  const incomplete = {
    groups: [
      {
        match: 'all' as const,
        exclude: false,
        rules: [{ field: 'incomplete' as const, op: 'is' as const, value: true }],
      },
    ],
  };

  return (
    <div className="proto">
      <div className="ph">
        <div>
          <h1>{m('title')}</h1>
          <p>{m('sub')}</p>
        </div>
        <div className="pb">
          <Link className="btn" href="/admin/business-directory/segments" data-action="biz.segments.open">
            <Layers size={16} aria-hidden /> {m('segments')}
          </Link>
          {g.level >= 2 && (
            <Link
              className="btn"
              href={`/admin/business-directory/exports${directoryQuery({ f: filter, q })}`}
              data-action="biz.exports.open"
            >
              <Download size={16} aria-hidden /> {m('exports')}
            </Link>
          )}
        </div>
      </div>
      <FilterBuilder
        key={sp.segment ?? 'filter'}
        locale={locale}
        basePath="/admin/business-directory"
        facets={facets}
        initial={filter}
        q={q}
        segment={open ? { id: open.id, name: open.name, description: open.description } : null}
        canSave={g.level >= 2}
      />
      <DirectoryTable
        locale={locale}
        rows={result.rows}
        total={result.total}
        page={page}
        pages={Math.max(1, Math.ceil(result.total / SIZE))}
        sort={sort}
        dir={dir}
        filter={filter}
        q={q}
        segment={sp.segment}
        canExport={g.level >= 2}
        canMessage={staffLevel(session.access, 'out') >= 2}
      />
      <div className="card" data-quality>
        <div className="ch">
          <h3>
            <Database size={16} aria-hidden /> {m('quality')}
          </h3>
        </div>
        <p>
          <Link href={`/admin/business-directory${directoryQuery({ f: incomplete })}`} data-action="biz.incomplete">
            {m('incomplete')}
          </Link>
        </p>
        {g.level >= 2 &&
          (duplicates.length === 0 ? (
            <p className="muted" data-duplicates="none">
              {m('noDuplicates')}
            </p>
          ) : (
            <ul data-duplicates={duplicates.length}>
              {duplicates.map((d, i) => (
                <li key={i}>
                  <b>{m(`dup_${d.why}`)}: </b>
                  {d.rows.map((r, j) => (
                    <span key={r.member_id}>
                      {j > 0 && ', '}
                      <Link href={`/admin/business-directory/profile?id=${r.member_id}`} data-action="biz.profile.open">
                        {r.business_name} ({r.member_no})
                      </Link>
                    </span>
                  ))}
                </li>
              ))}
            </ul>
          ))}
      </div>
    </div>
  );
}
