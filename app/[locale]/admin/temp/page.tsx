import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { NoAccess } from '@/components/admin/no-access';
import { ScanDesk, type ScanRow } from '@/components/certificates/scan-desk';
import { Ic } from '@/components/membership/ui';
import { Kpi } from '@/components/review/kpi';
import { PageHeader } from '@/components/shared/page-header';
import { Link } from '@/i18n/navigation';
import { asLocale } from '@/i18n/locale';
import { CERT_FIELDS } from '@/lib/certificates/ai';
import { voucherDate } from '@/lib/committee/voucher';
import { msg } from '@/lib/nav/model';
import { staffLevel } from '@/lib/permissions/levels';
import { requireUser } from '@/lib/permissions/server';
import { createClient } from '@/lib/supabase/server';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return { title: msg(asLocale((await params).locale), 'certs.title') };
}

export const dynamic = 'force-dynamic';

/**
 * Certificates (docs/21 points 29–30; replaces "Temporary & Certificates" — temporary membership is abolished, 0440).
 * MCCI uploads the scans of the certificates printed by the security press; each is read, matched and reviewed; a
 * person confirms and the QR is stamped on the scan (migration 0450). Module 'temp': view ≥ 1, work ≥ 2, override ≥ 3.
 */
export default async function CertificatesPage({ params }: Props) {
  const locale = asLocale((await params).locale);
  setRequestLocale(locale);
  const session = await requireUser();
  const level = staffLevel(session.access, 'temp');
  const m = (k: string, v?: Record<string, string>) => msg(locale, `certs.${k}`, v);
  if (level < 1) {
    return (
      <>
        <PageHeader
          locale={locale}
          title={{ en: msg('en', 'certs.title'), ur: msg('ur', 'certs.title') }}
          bilingual={false}
        />
        <NoAccess locale={locale} designation={session.access.staff?.designation ?? ''} module="temp" />
      </>
    );
  }
  const supabase = await createClient();
  const [{ data: scans }, { data: members }, { data: docs }] = await Promise.all([
    supabase
      .from('certificate_scans')
      .select(
        'id, file_name, status, uploaded_at, extracted, conflicts, match_member, document_id, stamped_path, review_note, log',
      )
      .order('uploaded_at', { ascending: false })
      .limit(100),
    supabase
      .from('members')
      .select('id, member_no, class, companies!inner(name, demo)')
      .eq('companies.demo', false)
      .in('status', ['Permanent', 'Temporary'])
      .order('member_no')
      .limit(2000),
    supabase.from('documents').select('id, code, status').eq('kind', 'certificate'),
  ]);
  const label = (x: { member_no: string; companies: unknown }) =>
    `${x.member_no} · ${(x.companies as { name: string } | null)?.name ?? ''}`;
  const memberOpts = (members ?? []).map((x) => ({ id: x.id, label: label(x) }));
  const byId = new Map(memberOpts.map((x) => [x.id, x]));
  const codes = new Map((docs ?? []).map((x) => [x.id, x.code]));
  const docStatus = new Map((docs ?? []).map((x) => [x.id, x.status as string]));
  const rows: ScanRow[] = (scans ?? []).map((s) => {
    const ex = (s.extracted ?? {}) as Record<string, { value: string | null; confidence: number }>;
    return {
      id: s.id,
      fileName: s.file_name ?? s.id,
      status: s.status as ScanRow['status'],
      uploadedAt: voucherDate(s.uploaded_at, locale),
      fields: CERT_FIELDS.filter((k) => ex[k]).map((k) => ({
        key: k,
        value: ex[k]!.value,
        confidence: ex[k]!.confidence,
      })),
      conflicts: s.conflicts ?? [],
      matched: s.match_member ? (byId.get(s.match_member) ?? { id: s.match_member, label: '—' }) : null,
      code: s.document_id ? (codes.get(s.document_id) ?? null) : null,
      stamped: Boolean(s.stamped_path),
      docStatus: s.document_id ? (docStatus.get(s.document_id) ?? null) : null,
      note: s.review_note,
      log: ((s.log ?? []) as { step: string }[]).map((x) => x.step),
    };
  });
  const count = (st: ScanRow['status'][]) => rows.filter((r) => st.includes(r.status)).length;

  return (
    <div className="proto">
      <div className="ph">
        <div>
          <h1>{m('title')}</h1>
          <p>{m('sub')}</p>
        </div>
        <div className="pb">
          <Link className="btn" href="/admin/documents" data-action="nav">
            <Ic name="shield" /> {m('registry')}
          </Link>
        </div>
      </div>
      <div className="kg">
        <Kpi
          label={m('kReview')}
          value={count(['extracted', 'uploaded'])}
          sub={m('kReviewSub')}
          icon="scan"
          color="#f59e0b"
        />
        <Kpi
          label={m('kConflicts')}
          value={rows.filter((r) => r.status === 'extracted' && r.conflicts.length).length}
          sub={m('kConflictsSub')}
          icon="flag"
          color="#ef4444"
        />
        <Kpi label={m('kConfirmed')} value={count(['confirmed'])} sub={m('kConfirmedSub')} icon="qr" color="#1fa34a" />
        <Kpi label={m('kFailed')} value={count(['failed'])} sub={m('kFailedSub')} icon="x" color="#64748b" />
      </div>
      <ScanDesk locale={locale} rows={rows} members={memberOpts} canWork={level >= 2} canOverride={level >= 3} />
    </div>
  );
}
