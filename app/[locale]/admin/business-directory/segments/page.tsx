import { ArrowLeft, Download, Filter } from 'lucide-react';
import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { DeleteSegment } from '@/components/business/segment-actions';
import { guardStaff } from '@/components/services/staff-page';
import { Link } from '@/i18n/navigation';
import { asLocale } from '@/i18n/locale';
import { decodeFilter, directoryQuery } from '@/lib/business/filters';
import { countSegment, loadSegments } from '@/lib/business/load';
import { msg } from '@/lib/nav/model';
import { requireUser } from '@/lib/permissions/server';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return { title: msg(asLocale((await params).locale), 'screens.admin.segments') };
}

export const dynamic = 'force-dynamic';

/** Saved segments: dynamic filters, recounted on every visit. New ones are saved from the directory's filter. */
export default async function SegmentsPage({ params }: Props) {
  const locale = asLocale((await params).locale);
  setRequestLocale(locale);
  const session = await requireUser();
  const g = guardStaff(session, locale, 'biz', 'screens.admin.segments');
  if (g.denied) return g.denied;
  const m = (k: string, v?: Record<string, string>) => msg(locale, `biz.segments.${k}`, v);
  const segments = await loadSegments();
  const counts = await Promise.all(segments.map((s) => countSegment(s.definition)));
  return (
    <div className="proto">
      <div className="ph">
        <div>
          <h1>{m('title')}</h1>
          <p>{m('sub')}</p>
        </div>
        <div className="pb">
          <Link className="btn" href="/admin/business-directory" data-action="biz.back">
            <ArrowLeft size={16} aria-hidden /> {m('back')}
          </Link>
        </div>
      </div>
      {segments.length === 0 && (
        <div className="card" data-empty>
          <p className="muted">{m('empty')}</p>
        </div>
      )}
      {segments.map((s, i) => (
        <div className="card" key={s.id} data-segment={s.name}>
          <div className="ch">
            <h3>{s.name}</h3>
            <span className="bd blue" data-kind={s.kind}>
              {m('dynamic')}
            </span>
          </div>
          {s.description && <p>{s.description}</p>}
          <p data-segment-count={counts[i] ?? ''}>
            <b>{counts[i] === null ? m('countFailed') : m('count', { n: String(counts[i]) })}</b>
          </p>
          <div className="pb">
            <Link
              className="btn btn-w"
              href={`/admin/business-directory?segment=${s.id}`}
              data-action="biz.segment.open"
            >
              <Filter size={15} aria-hidden /> {m('open')}
            </Link>
            {g.level >= 2 && (
              <>
                <Link
                  className="btn btn-w"
                  href={`/admin/business-directory/exports${directoryQuery({ f: decodeFilter(s.definition) })}`}
                  data-action="biz.segment.export"
                >
                  <Download size={15} aria-hidden /> {m('export')}
                </Link>
                <DeleteSegment locale={locale} id={s.id} name={s.name} />
              </>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
