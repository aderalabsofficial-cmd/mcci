import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { Certificate, type CertData } from '@/components/certificates/certificate';
import { PrintButton } from '@/components/membership/print-button';
import { both, Card, Ic, L } from '@/components/membership/ui';
import { CopyButton } from '@/components/shared/copy-button';
import { Link } from '@/i18n/navigation';
import { asLocale } from '@/i18n/locale';
import { voucherDate } from '@/lib/committee/voucher';
import { loadPublicSettings } from '@/lib/membership/load';
import { msg } from '@/lib/nav/model';
import { requireUser } from '@/lib/permissions/server';
import { rosette } from '@/lib/qr/rosette';
import { qrSvg, verifyUrl } from '@/lib/qr/svg';
import { createClient } from '@/lib/supabase/server';

type Props = { params: Promise<{ locale: string }>; searchParams: Promise<{ code?: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return { title: msg(asLocale((await params).locale), 'screens.portal.documents') };
}

export const dynamic = 'force-dynamic';

const TONE: Record<string, string> = {
  Valid: 'green',
  Temporary: 'blue',
  Superseded: 'orange',
  Expired: 'red',
  Revoked: 'red',
};

/**
 * My Documents (prototype member/documents): everything MCCI issued to the company — the membership certificate (the
 * security-press scan with its QR stamped, 0450), cards and letters — with view, print and share (public QR link).
 * Read with the member's session (RLS: company area docs ≥ 1).
 */
export default async function DocumentsPage({ params, searchParams }: Props) {
  const locale = asLocale((await params).locale);
  setRequestLocale(locale);
  await requireUser();
  const m = (k: string, v?: Record<string, string>) => msg(locale, `docs.member.${k}`, v);
  const supabase = await createClient();
  const code = (await searchParams).code;
  const [{ data: docs }, settings] = await Promise.all([
    supabase
      .from('documents')
      .select('code, kind, title, status, valid_to, created_at, path')
      .order('created_at', { ascending: false }),
    loadPublicSettings(),
  ]);
  let cert: CertData | null = null;
  // a scanned certificate (security press, 0450): the stamped scan and the same QR, larger
  const scanned = code
    ? (docs ?? []).find((d) => d.code === code && d.kind === 'certificate' && d.path?.startsWith('scans/'))
    : undefined;
  const bigQr = scanned ? await qrSvg(verifyUrl(scanned.code)) : null;
  // the same security pattern as on the stamped scan and the public verification page (lib/qr/rosette.ts)
  const pattern = scanned ? rosette(scanned.code, 240) : null;
  if (code && !scanned) {
    const { data } = await supabase.schema('api').rpc('cert_view', { p_code: code });
    cert = (data?.[0] as CertData | undefined) ?? null;
  }

  return (
    <div className="proto">
      <div className="ph no-print">
        <div>
          <h1>
            <L {...both('docs.member.title')} />
          </h1>
          <p>{m('sub')}</p>
        </div>
      </div>
      {scanned && bigQr && (
        <div className="card psid" style={{ marginBottom: 18 }} data-cert={scanned.code}>
          <div className="ch no-print">
            <h3>{msg(locale, 'docs.admin.kinds.certificate')}</h3>
            <div className="pb">
              <PrintButton label={m('print')} />
              <Link className="btn" href="/portal/documents" data-action="nav">
                {m('close')}
              </Link>
            </div>
          </div>
          <div className="cert-scan">
            {/* eslint-disable-next-line @next/next/no-img-element -- the member's own certificate through the permission-checked route */}
            <img src={`/api/certificates/${scanned.code}`} alt={msg(locale, 'docs.admin.kinds.certificate')} />
            <div className="cert-qr">
              <div className="cert-qr-rosette" data-fingerprint={pattern?.fingerprint}>
                <span
                  className="cert-qr-pattern"
                  aria-hidden
                  dangerouslySetInnerHTML={{ __html: pattern?.svg ?? '' }}
                />
                <div className="cert-qr-svg" dangerouslySetInnerHTML={{ __html: bigQr }} />
              </div>
              <b>{scanned.code}</b>
              <small>{m('scanToVerify')}</small>
            </div>
          </div>
        </div>
      )}
      {cert && (
        <div className="card psid" style={{ marginBottom: 18 }}>
          <div className="ch no-print">
            <h3>{cert.title}</h3>
            <div className="pb">
              <PrintButton label={m('print')} />
              <Link className="btn" href="/portal/documents" data-action="nav">
                {m('close')}
              </Link>
            </div>
          </div>
          <Certificate data={cert} chamber={settings.chamber.name} />
        </div>
      )}
      <div className="no-print">
        <Card title={<L {...both('docs.member.issued')} />}>
          {docs?.length ? (
            docs.map((d) => (
              <div className="li" key={d.code} data-code={d.code}>
                <i style={{ background: d.kind === 'temp_certificate' ? '#14b8a6' : '#c8963e' }}>
                  <Ic name={d.kind === 'temp_certificate' ? 'hourglass' : 'award'} color="#fff" />
                </i>
                <div>
                  <b>{msg(locale, `docs.admin.kinds.${d.kind}`)}</b>
                  <small>
                    {d.code} · {m('issuedOn', { date: voucherDate(d.created_at, locale) })}
                    {d.valid_to
                      ? ` · ${m('validTo', { date: voucherDate(`${d.valid_to}T12:00:00+05:00`, locale) })}`
                      : ''}
                  </small>
                </div>
                <span className={`bd ${TONE[d.status] ?? 'gray'}`}>{msg(locale, `verify.status.${d.status}`)}</span>
                <div className="pb">
                  <Link className="btn btn-w" href={`/portal/documents?code=${d.code}`} data-action="doc.view">
                    {m('view')}
                  </Link>
                  <CopyButton text={verifyUrl(d.code)} label={m('share')} copied={m('copied')} />
                </div>
              </div>
            ))
          ) : (
            <p className="em">{m('none')}</p>
          )}
        </Card>
      </div>
    </div>
  );
}
