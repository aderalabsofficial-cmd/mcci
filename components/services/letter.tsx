import { voucherDate } from '@/lib/committee/voucher';
import { msg } from '@/lib/nav/model';
import { qrSvg, verifyUrl } from '@/lib/qr/svg';

export interface LetterData {
  code: string;
  status: string;
  token: string;
  service_key: string;
  service_name: string;
  company: string;
  member_no: string;
  member_status: string;
  issued_at: string;
  fields: [string, string][];
  signed_by: string | null;
}

/**
 * The issued service letter (svc.sign; docs/08 "service letters"): MCCI letterhead, reference and date, the member's
 * standing, the service paragraph, the particulars the member gave, the digital signature line and a QR code to the
 * public verification. English, as on MCCI's printed documents; the screen around it is bilingual.
 */
export async function ServiceLetter({ data, chamber }: { data: LetterData; chamber: { name: string; addr: string; tel: string; email: string } }) {
  const svg = await qrSvg(verifyUrl(data.code));
  const t = (k: string, v?: Record<string, string>) => msg('en', `svc.letter.${k}`, v);
  const body = ['ebil', 'visa', 'guar', 'sample', 'other', 'co', 'att'].includes(data.service_key) ? t(`body.${data.service_key}`) : t('body.other');
  return (
    <div className="cert" data-letter={data.code} lang="en" style={{ textAlign: 'start' }}>
      <div className="cert-in" style={{ textAlign: 'start' }}>
        {data.status !== 'Valid' && <div className="cert-rb">{data.status.toUpperCase()}</div>}
        <div style={{ display: 'flex', gap: 14, alignItems: 'center', borderBottom: '2px solid #b8892f', paddingBottom: 10 }}>
          {/* eslint-disable-next-line @next/next/no-img-element -- static logo, printed */}
          <img src="/images/logo.png" alt="MCCI" style={{ height: 64 }} />
          <div>
            <b style={{ fontSize: 17 }}>{chamber.name}</b>
            <div style={{ fontSize: 12.5 }}>
              {chamber.addr} · Tel {chamber.tel} · {chamber.email}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', margin: '14px 0', fontSize: 14 }}>
          <span>{t('ref', { token: data.token })}</span>
          <span>{t('date', { date: voucherDate(data.issued_at, 'en') })}</span>
        </div>
        <h2 style={{ textAlign: 'center', fontSize: 18, margin: '8px 0 4px' }}>{data.service_name}</h2>
        <p style={{ textAlign: 'center', fontWeight: 700, letterSpacing: '.06em', fontSize: 13 }}>{t('whom')}</p>
        <p style={{ margin: '14px 0 8px', lineHeight: 1.7 }}>
          {t('member', { company: data.company, status: data.member_status.toLowerCase(), no: data.member_no })} {body}
        </p>
        <table style={{ width: '100%', borderCollapse: 'collapse', margin: '10px 0', fontSize: 14 }}>
          <caption style={{ textAlign: 'start', fontWeight: 700, marginBottom: 4 }}>{t('details')}</caption>
          <tbody>
            {data.fields.map(([k, v]) => (
              <tr key={k}>
                <th scope="row" style={{ textAlign: 'start', padding: '6px 8px', borderBottom: '1px solid #e5dcc4', width: '40%', fontWeight: 600 }}>
                  {k}
                </th>
                <td style={{ padding: '6px 8px', borderBottom: '1px solid #e5dcc4' }}>{v}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p style={{ fontSize: 13, fontStyle: 'italic' }}>{t('liability')}</p>
        <div className="cert-ft">
          <div className="cert-qr">
            <span dangerouslySetInnerHTML={{ __html: svg }} />
            <small>
              {data.code}
              <br />
              {t('scan', { url: verifyUrl('').replace(/\/$/, '') })}
            </small>
          </div>
          <div className="cert-sg">
            <span className="sigline">
              <i>{t('esigned')}</i>
            </span>
            <b>{data.signed_by ?? t('signatory')}</b>
            <small style={{ display: 'block' }}>{t('signatory')}</small>
          </div>
        </div>
      </div>
    </div>
  );
}
