import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { Clock } from 'lucide-react';
import { NoAccess } from '@/components/admin/no-access';
import { PageHeader } from '@/components/shared/page-header';
import { Kpi, STAGE_TONE } from '@/components/review/kpi';
import { PipelineTable, type PipelineTableRow } from '@/components/review/pipeline-table';
import { Link } from '@/i18n/navigation';
import { asLocale } from '@/i18n/locale';
import type { Locale } from '@/i18n/routing';
import { staffLevel } from '@/lib/permissions/levels';
import { requireUser } from '@/lib/permissions/server';
import { loadPipeline } from '@/lib/review/load';
import { msg } from '@/lib/nav/model';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return { title: msg(asLocale((await params).locale), 'screens.admin.requests') };
}

export const dynamic = 'force-dynamic';

/** whole days since submission, as "{n} days" */
const ago = (iso: string | null, locale: Locale) =>
  iso
    ? msg(locale, 'review.desk.days', {
        n: String(Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000))),
      })
    : '';

/**
 * Membership Pipeline (prototype admin/requests): KPIs, stage board and the table of every submitted application.
 * Staff with module 'mem' ≥ 1 (docs/06); the admin layout already required active staff with 2-step login.
 */
export default async function PipelinePage({ params }: Props) {
  const locale = asLocale((await params).locale);
  setRequestLocale(locale);
  const session = await requireUser();
  const title = { en: msg('en', 'review.pipeline.title'), ur: msg('ur', 'review.pipeline.title') };
  if (staffLevel(session.access, 'mem') < 1) {
    return (
      <>
        <PageHeader locale={locale} title={title} bilingual={false} />
        <NoAccess locale={locale} designation={session.access.staff?.designation ?? ''} module="mem" />
      </>
    );
  }
  const rows = await loadPipeline();
  const m = (k: string, v?: Record<string, string>) => msg(locale, `review.pipeline.${k}`, v);
  const at = (...s: string[]) => rows.filter((r) => s.includes(r.stage));
  const cols: [string, string[], string][] = [
    ['review', ['submitted', 'review'], '#f59e0b'],
    ['returned', ['returned'], '#ef4444'],
    ['proposer', ['proposer'], '#3b82f6'],
    ['committee', ['committee'], '#c8963e'],
    ['payment', ['payment'], '#14b8a6'],
    ['temp', ['temp'], '#1fa34a'],
  ];
  const date = (iso: string | null) =>
    iso
      ? new Date(iso).toLocaleDateString(locale === 'ur' ? 'ur-PK' : 'en-GB', {
          timeZone: 'Asia/Karachi',
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        })
      : '—';
  const tableRows: PipelineTableRow[] = rows.map((r) => ({
    token: r.token,
    company: r.name,
    type: r.biz ? msg(locale, `membership.biz.${r.biz}.name`) : '—',
    cls: r.cls ? `${msg(locale, `membership.classes.${r.cls}`)}${r.women ? ' · W' : ''}` : '—',
    submitted: date(r.submitted_at),
    stage: r.stage,
    stageLabel: msg(locale, `review.stages.${r.stage}`),
    tone: STAGE_TONE[r.stage] ?? 'gray',
  }));

  return (
    <div className="proto">
      <div className="ph">
        <div>
          <h1>{m('title')}</h1>
          <p>{m('sub')}</p>
        </div>
      </div>
      <div className="kg">
        <Kpi
          label={m('kInReview')}
          value={at('submitted', 'review').length}
          sub={m('kInReviewSub', { n: String(at('submitted').length) })}
          icon="shield"
          color="#f59e0b"
        />
        <Kpi label={m('kReturned')} value={at('returned').length} sub={m('kReturnedSub')} icon="flag" color="#ef4444" />
        <Kpi
          label={m('kProposer')}
          value={at('proposer').length}
          sub={m('kProposerSub')}
          icon="users"
          color="#3b82f6"
        />
        <Kpi
          label={m('kCommittee')}
          value={at('committee').length}
          sub={m('kCommitteeSub')}
          icon="award"
          color="#c8963e"
        />
      </div>
      <div className="card" style={{ marginBottom: 18 }}>
        <div className="ch">
          <h3>{m('board')}</h3>
        </div>
        <div className="kan" style={{ gridTemplateColumns: 'repeat(6, minmax(0, 1fr))' }}>
          {cols.map(([k, stages, color]) => {
            const list = at(...stages);
            return (
              <div className="kc" key={k}>
                <h4>
                  <i style={{ background: color }} />
                  {m(`columns.${k}`)}
                  <b>{list.length}</b>
                </h4>
                {list.map((a) => (
                  <Link key={a.token} className="kcard" href={`/admin/mreview?t=${a.token}`} data-action="adm.app.open">
                    <b>{a.name || a.token}</b>
                    <small>
                      <Clock size={14} color="#94a3b8" aria-hidden /> {ago(a.submitted_at, locale)}
                    </small>
                  </Link>
                ))}
              </div>
            );
          })}
        </div>
      </div>
      <PipelineTable locale={locale} rows={tableRows} />
    </div>
  );
}
