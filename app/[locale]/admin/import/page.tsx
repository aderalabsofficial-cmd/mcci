import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { NoAccess } from '@/components/admin/no-access';
import { ImportPreview, type InviteCounts, type PreviewMember, type PreviewRow } from '@/components/import/import-preview';
import { ImportUpload } from '@/components/import/import-upload';
import { PageHeader } from '@/components/shared/page-header';
import { Link } from '@/i18n/navigation';
import { asLocale } from '@/i18n/locale';
import { aiEnabled } from '@/lib/ai/extract';
import { msg } from '@/lib/nav/model';
import { staffLevel } from '@/lib/permissions/levels';
import { requireUser } from '@/lib/permissions/server';
import { createClient } from '@/lib/supabase/server';

type Props = { params: Promise<{ locale: string }>; searchParams: Promise<{ id?: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return { title: msg(asLocale((await params).locale), 'imp.title') };
}

export const dynamic = 'force-dynamic';

const STEP_COLORS = ['#3b82f6', '#c8963e', '#14b8a6', '#8b5cf6'];
const TONE: Record<string, string> = { preview: 'orange', committed: 'green', discarded: 'gray', rolled_back: 'red' };

/**
 * Data Import (prototype admin/import, docs/13): bring the existing member list in from CSV, Excel or PDF. Upload →
 * checked preview (nothing written) → decisions per row → confirmed import, or roll back. Staff reg ≥ 2; roll back
 * reg ≥ 3. Uploaded files stay in the private `imports` bucket and are never shown publicly.
 */
export default async function ImportPage({ params, searchParams }: Props) {
  const locale = asLocale((await params).locale);
  setRequestLocale(locale);
  const session = await requireUser();
  const level = staffLevel(session.access, 'reg');
  const m = (k: string, v?: Record<string, string>) => msg(locale, `imp.${k}`, v);
  if (level < 2) {
    return (
      <>
        <PageHeader locale={locale} title={{ en: msg('en', 'imp.title'), ur: msg('ur', 'imp.title') }} bilingual={false} />
        <NoAccess locale={locale} designation={session.access.staff?.designation ?? ''} module="reg" />
      </>
    );
  }
  const supabase = await createClient();
  const { data: imports } = await supabase
    .from('imports')
    .select('id, file_name, source, ai, rows_total, rows_error, report, status, at')
    .order('at', { ascending: false })
    .limit(50);
  const openId = (await searchParams).id;
  const open = (imports ?? []).find((i) => i.id === openId) ?? null;

  let rows: PreviewRow[] = [];
  let invites: InviteCounts | null = null;
  const members: Record<string, PreviewMember> = {};
  if (open) {
    const { data } = await supabase
      .from('import_rows')
      .select('row_no, data, issues, confidence, match, match_member, decision, result, invite_status, invited_at')
      .eq('import_id', open.id)
      .order('row_no');
    rows = (data ?? []) as unknown as PreviewRow[];
    if (open.status === 'committed') {
      // invitations to the members it created or updated (0406); "sending" for over 10 minutes is sent again
      invites = { sent: 0, failed: 0, no_email: 0, has_account: 0, waiting: 0 };
      for (const r of data ?? []) {
        if (r.result !== 'created' && r.result !== 'updated') continue;
        const stale = r.invite_status === 'sending' && Date.now() - new Date(r.invited_at ?? 0).getTime() > 10 * 60_000;
        const k = !r.invite_status || stale ? 'waiting' : r.invite_status === 'sending' ? 'sent' : (r.invite_status as keyof InviteCounts);
        invites[k]++;
      }
    }
    const ids = [...new Set(rows.map((r) => r.match_member).filter((x): x is string => Boolean(x)))];
    for (let i = 0; i < ids.length; i += 200) {
      const { data: ms } = await supabase
        .from('members')
        .select('id, member_no, class, status, rep_name, valid_to, women, serial, imported, companies(name, ntn)')
        .in('id', ids.slice(i, i + 200));
      for (const x of ms ?? []) {
        const c = x.companies as unknown as { name: string; ntn: string | null } | null;
        members[x.id] = {
          member_no: x.member_no,
          class: x.class,
          status: x.status,
          representative_name: x.rep_name,
          valid_to: x.valid_to,
          women: x.women,
          certificate_serial: x.serial ?? '',
          company_name: c?.name ?? '',
          ntn: c?.ntn ?? '',
          updatable: x.imported && ['Permanent', 'Expired', 'Suspended'].includes(x.status),
        };
      }
    }
  }
  const date = (iso: string) =>
    new Date(iso).toLocaleString(locale === 'ur' ? 'ur-PK' : 'en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Karachi' });
  const count = (r: unknown, k: string) => Number((r as Record<string, unknown> | null)?.[k] ?? 0);

  return (
    <div className="proto">
      <div className="ph">
        <div>
          <h1>{m('title')}</h1>
          <p>{m('sub')}</p>
        </div>
        <div className="pb">
          <ImportUpload locale={locale} aiOn={aiEnabled()} />
        </div>
      </div>
      <div className="gr" style={{ gridTemplateColumns: '1fr 1.4fr' }}>
        <section className="card" aria-labelledby="imp-steps">
          <div className="ch">
            <h3 id="imp-steps">{m('steps.title')}</h3>
          </div>
          {(['template', 'upload', 'validate', 'commit'] as const).map((s, i) => (
            <div className="stp st" key={s}>
              <i style={{ background: STEP_COLORS[i] }}>{i + 1}</i>
              <div>
                <b>{m(`steps.${s}`)}</b>
                <small>{m(`steps.${s}Sub`)}</small>
              </div>
            </div>
          ))}
        </section>
        <section className="card" aria-labelledby="imp-history">
          <div className="ch">
            <h3 id="imp-history">{m('history.title')}</h3>
          </div>
          {imports?.length ? (
            <div className="tw" tabIndex={0} role="region" aria-label={m('history.title')}>
              <table>
                <thead>
                  <tr>
                    {(['import', 'file', 'rows', 'ready', 'dup', 'err', 'status'] as const).map((c) => (
                      <th key={c} scope="col">
                        {m(`history.cols.${c}`)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {imports.map((i) => (
                    <tr className="st" key={i.id} data-import={i.id} aria-current={i.id === open?.id ? 'true' : undefined}>
                      <td>
                        <Link className="rowlink" href={`/admin/import?id=${i.id}`} data-action="imp.open">
                          <b>{date(i.at)}</b>
                        </Link>
                      </td>
                      <td>
                        {i.file_name ?? '—'}
                        {i.ai ? ' · AI' : ''}
                      </td>
                      <td>{i.rows_total ?? 0}</td>
                      <td>{i.status === 'preview' ? count(i.report, 'new') : count(i.report, 'created') + count(i.report, 'updated')}</td>
                      <td>{count(i.report, 'exists') + count(i.report, 'possible')}</td>
                      <td>{i.rows_error ?? 0}</td>
                      <td>
                        <span className={`bd ${TONE[i.status] ?? 'gray'}`}>{m(`status.${i.status}`)}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="em">{m('history.none')}</p>
          )}
        </section>
      </div>
      {open && (
        <ImportPreview
          key={open.id}
          locale={locale}
          importId={open.id}
          fileName={open.file_name ?? ''}
          status={open.status as 'preview' | 'committed' | 'discarded' | 'rolled_back'}
          ai={open.ai}
          rows={rows}
          members={members}
          canRollback={level >= 3}
          invites={invites}
        />
      )}
    </div>
  );
}
