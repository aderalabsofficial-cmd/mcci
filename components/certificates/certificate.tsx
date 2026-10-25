import { voucherDate } from '@/lib/committee/voucher';
import { msg } from '@/lib/nav/model';
import { qrSvg, verifyUrl } from '@/lib/qr/svg';

/** what api.cert_view returns for one issued document */
export interface CertData {
  code: string;
  kind: string;
  title: string;
  status: string;
  company: string | null;
  class: string | null;
  women: boolean | null;
  member_no: string | null;
  issued_at: string | null;
  expires_at: string | null;
  extended: boolean | null;
  temp_status: string | null;
  voucher_no: string | null;
  valid_to: string | null;
}

/**
 * Temporary Membership Certificate (prototype docs.js certBase / M.tempCert): watermark, status ribbon, company,
 * class, number, validity, the paid voucher, QR to the public verification and the Secretary General's e-signature
 * line. English, as on MCCI's printed certificates; the screen around it is bilingual.
 */
export async function Certificate({ data, chamber }: { data: CertData; chamber: string }) {
  const svg = await qrSvg(verifyUrl(data.code));
  const t = (k: string, v?: Record<string, string>) => msg('en', `certificate.${k}`, v);
  const daysLeft = data.expires_at ? Math.max(0, Math.ceil((new Date(data.expires_at).getTime() - Date.now()) / 86_400_000)) : 0;
  const ribbon =
    data.status === 'Revoked'
      ? t('ribbon.revoked')
      : data.status === 'Superseded'
        ? t('ribbon.superseded')
        : data.status === 'Expired' || data.temp_status === 'expired'
          ? t('ribbon.expired')
          : t('ribbon.valid', { n: String(daysLeft) });
  const cls = `${data.class ?? ''}${data.women ? ' (Women Entrepreneur)' : ''}`;
  const day = (iso: string | null) => (iso ? voucherDate(iso, 'en') : '—');
  return (
    <div className="cert temp" data-cert={data.code} lang="en">
      <div className="cert-in">
        <div className="cert-rb">{ribbon}</div>
        <div className="cert-wm" aria-hidden>
          TEMPORARY
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element -- static logo, printed */}
        <img className="cert-lg" src="/images/logo.png" alt="MCCI" />
        <div className="cert-ch">{chamber}</div>
        <h2>{t('tempTitle')}</h2>
        <p className="cert-l">{t('certify')}</p>
        <div className="cert-co">{data.company}</div>
        <p className="cert-l">
          {t('tempLine1')} <b>{cls}</b> {t('tempLine2')}
        </p>
        <div className="cert-meta">
          <div>
            <small>{t('memberNo')}</small>
            <b>{data.member_no ?? '—'}</b>
          </div>
          <div>
            <small>{t('validFrom')}</small>
            <b>{day(data.issued_at)}</b>
          </div>
          <div>
            <small>{t('validUntil')}</small>
            <b>
              {day(data.expires_at)}
              {data.extended ? ` ${t('extended')}` : ''}
            </b>
          </div>
          <div>
            <small>{t('receipt')}</small>
            <b>{data.voucher_no ?? '—'}</b>
          </div>
        </div>
        <div className="cert-ft">
          <div className="cert-qr">
            <span dangerouslySetInnerHTML={{ __html: svg }} />
            <small>
              {data.code}
              <br />
              {t('scan')}
            </small>
          </div>
          <div className="cert-sg">
            <span className="sigline">
              <i>{t('esigned')}</i>
            </span>
            <b>{t('sg')}</b>
          </div>
        </div>
        <p className="cert-note">{t('tempFoot', { url: verifyUrl('').replace(/\/$/, '') })}</p>
      </div>
    </div>
  );
}

