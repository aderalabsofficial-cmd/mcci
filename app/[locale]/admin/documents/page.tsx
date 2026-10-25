import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { ActionButton } from '@/components/admin/action-button';
import { FlashProvider } from '@/components/admin/flash';
import { NoAccess } from '@/components/admin/no-access';
import { Certificate, type CertData } from '@/components/certificates/certificate';
import { PrintButton } from '@/components/membership/print-button';
import { Kpi } from '@/components/review/kpi';
import { PageHeader } from '@/components/shared/page-header';
import { Link } from '@/i18n/navigation';
import { asLocale } from '@/i18n/locale';
import { voucherDate } from '@/lib/committee/voucher';
import { loadPublicSettings } from '@/lib/membership/load';
import { msg } from '@/lib/nav/model';
import { staffLevel } from '@/lib/permissions/levels';
import { requireUser } from '@/lib/permissions/server';
import { createClient } from '@/lib/supabase/server';
import { loadRegistry } from '@/lib/temp/load';

type Props = { params: Promise<{ locale: string }>; searchParams: Promise<{ code?: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return { title: msg(asLocale((await params).locale), 'docs.admin.title') };
}

export const dynamic = 'force-dynamic';

const TONE: Record<string, string> = { Valid: 'green', Temporary: 'blue', Superseded: 'orange', Expired: 'red', Revoked: 'red' };

/**
 * Documents & QR Registry (prototype admin/documents): every issued document with its public scans and status; open one
 * to see and print it; the SG revokes (docs ≥ 3). Staff with docs ≥ 1 or temp ≥ 1 read it.
 */
export default async function DocumentsAdminPage({ params, searchParams }: Props) {
  const locale = asLocale((await params).locale);
  setRequestLocale(locale);
  const session = await requireUser();
  const level = Math.max(staffLevel(session.access, 'docs'), staffLevel(session.access, 'temp'));
  const m = (k: string, v?: Record<string, string>) => msg(locale, `docs.admin.${k}`, v);
  if (level < 1) {
    return (
      <>
        <PageHeader locale={locale} title={{ en: msg('en', 'docs.admin.title'), ur: msg('ur', 'docs.admin.title') }} bilingual={false} />
        <NoAccess locale={locale} designation={session.access.staff?.designation ?? ''} module="docs" />
      </>
    );
  }
  const code = (await searchParams).code;
  const [rows, settings] = await Promise.all([loadRegistry(), loadPublicSettings()]);
  let cert: CertData | null = null;
  if (code) {
    const supabase = await createClient();
    const { data } = await supabase.schema('api').rpc('cert_view', { p_code: code });
    cert = (data?.[0] as CertData | undefined) ?? null;
  }
  const canRevoke = staffLevel(session.access, 'docs') >= 3;

  return (
    <div className="proto">
      <FlashProvider>
        <div className="ph no-print">
          <div>
            <h1>{m('title')}</h1>
            <p>{m('sub')}</p>
          </div>
        </div>
        {cert && (
          <div className="card psid" style={{ marginBottom: 18 }}>
            <div className="ch no-print">
              <h3>{cert.title}</h3>
              <div className="pb">
                <PrintButton label={m('print')} />
                <Link className="btn" href="/admin/documents" data-action="nav">
                  {m('close')}
                </Link>
              </div>
            </div>
            <Certificate data={cert} chamber={settings.chamber.name} />
          </div>
        )}
        <div className="kg no-print">
          <Kpi label={m('kDocs')} value={rows.length} sub={m('kDocsSub')} icon="file" color="#c8963e" />
          <Kpi label={m('kTemp')} value={rows.filter((d) => d.kind === 'temp_certificate' && d.status === 'Temporary').length} icon="hourglass" color="#14b8a6" />
          <Kpi label={m('kSuperseded')} value={rows.filter((d) => d.status === 'Superseded').length} sub={m('kSupersededSub')} icon="refresh" color="#f59e0b" />
          <Kpi label={m('kScans')} value={rows.reduce((s, d) => s + d.scans, 0)} icon="qr" color="#3b82f6" />
        </div>
        <div className="card no-print">
          <div className="ch">
            <h3>{m('table')}</h3>
          </div>
          <div className="tw" tabIndex={0} role="region" aria-label={m('table')}>
            <table>
              <thead>
                <tr>
                  {(['code', 'type', 'to', 'issued', 'scans', 'status'] as const).map((c) => (
                    <th key={c} scope="col">
                      {m(`cols.${c}`)}
                    </th>
                  ))}
                  <th scope="col">{m('cols.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((d) => (
                  <tr className="st" key={d.code} data-code={d.code}>
                    <td>
                      <b>{d.code}</b>
                    </td>
                    <td>{m(`kinds.${d.kind}`)}</td>
                    <td>
                      {d.company}
                      {d.member_no ? ` · ${d.member_no}` : ''}
                    </td>
                    <td>{voucherDate(d.created_at, locale)}</td>
                    <td>{d.scans}</td>
                    <td>
                      <span className={`bd ${TONE[d.status] ?? 'gray'}`}>{msg(locale, `verify.status.${d.status}`)}</span>
                    </td>
                    <td>
                      <div className="pb">
                        <Link className="btn btn-w" href={`/admin/documents?code=${d.code}`} data-action="qr.view">
                          {m('open')}
                        </Link>
                        {canRevoke && d.status !== 'Revoked' && (
                          <ActionButton locale={locale} action="qr.revoke" target={d.code} subject={`${d.code} · ${d.company}`} />
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {!rows.length && (
                  <tr className="st">
                    <td colSpan={7} className="em">
                      {m('none')}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </FlashProvider>
    </div>
  );
}
