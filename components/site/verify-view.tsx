import { BadgeCheck, CircleAlert, QrCode, Search, ShieldCheck, ShieldX } from 'lucide-react';
import type { Locale } from '@/i18n/routing';
import { voucherDate } from '@/lib/committee/voucher';
import { msg } from '@/lib/nav/model';
import { rosette } from '@/lib/qr/rosette';
import type { VerifyResult } from '@/lib/verify/admin';

// a current temporary membership and its temporary certificate are valid (prototype site/verify)
const GOOD = new Set(['Active', 'Valid', 'Temporary']);

/** why a found record is not current: a replaced or revoked certificate first, then the membership, then the certificate */
function badTitle(v: { member_status: string | null; certificate_status: string | null }): string {
  const cert = v.certificate_status;
  if (cert === 'Superseded' || cert === 'Revoked') return cert;
  if (!GOOD.has(v.member_status ?? ''))
    return v.member_status === 'Suspended' || v.member_status === 'Revoked' ? v.member_status : 'Expired';
  return 'CertExpired';
}

/**
 * Public membership verification (prototype site/verify; owner, 30 Oct 2026; docs/26): check a certificate by its QR
 * or reference, or a business by its membership number. Only the approved business details are shown — never the
 * certificate scan, documents, addresses, phone numbers, emails, ID numbers or links. The certificate's security
 * pattern (lib/qr/rosette.ts) is drawn from its reference so it can be compared with the paper; authenticity comes
 * from the signed QR and the database, not from the picture.
 */
export function VerifyView({
  locale,
  code,
  member,
  result,
}: {
  locale: Locale;
  code: string;
  member: string;
  result: VerifyResult | null;
}) {
  const m = (k: string, v?: Record<string, string>) => msg(locale, `verify.${k}`, v);
  const other = locale === 'en' ? 'ur' : 'en';
  const day = (d: string | null) => (d ? voucherDate(`${d}T12:00:00+05:00`, locale) : '—');
  const base = locale === 'ur' ? '/ur/verify' : '/verify';
  const v = result?.kind === 'found' ? result.v : null;
  const ok = v
    ? GOOD.has(v.member_status ?? '') && (v.certificate_status === null || GOOD.has(v.certificate_status))
    : false;
  const pattern = v?.certificate_ref ? rosette(v.certificate_ref, 220) : null;
  return (
    <div className="proto">
      <section className="relative isolate overflow-hidden bg-[#0b2a5b] pt-[calc(var(--xh)+28px)] pb-10 text-white">
        <div className="mx-auto w-full max-w-[920px] px-[var(--gutter)] sm:px-6">
          <h1 className="text-[30px] leading-tight font-extrabold sm:text-[44px]">{m('title')}</h1>
          <p lang={other} className="mt-1 text-[18px] text-white/85">
            {msg(other, 'verify.title')}
          </p>
          <p className="mt-3 max-w-[640px] text-white/85">{m('sub')}</p>
        </div>
      </section>
      <div className="mx-auto w-full max-w-[920px] px-[var(--gutter)] py-8 sm:px-6">
        <div className="vf-forms">
          <section className="card" aria-labelledby="vchk">
            <div className="ch">
              <h3 id="vchk">{m('check')}</h3>
            </div>
            <form method="get" action={base} className="grid gap-3">
              <label className="form-field">
                {m('codeLabel')}
                <input
                  name="c"
                  defaultValue={code}
                  placeholder="MCCI-QR-ABCDE-23456"
                  autoComplete="off"
                  spellCheck={false}
                  required
                  maxLength={40}
                />
              </label>
              <button type="submit" className="btn btn-primary" data-action="verify.go">
                <QrCode size={16} aria-hidden /> {m('go')}
              </button>
            </form>
          </section>
          <section className="card" aria-labelledby="vmem">
            <div className="ch">
              <h3 id="vmem">{m('byMember')}</h3>
            </div>
            <form method="get" action={base} className="grid gap-3">
              <label className="form-field">
                {m('memberLabel')}
                <input
                  name="m"
                  defaultValue={member}
                  placeholder="MCCI-C-1134"
                  autoComplete="off"
                  spellCheck={false}
                  required
                  maxLength={30}
                />
              </label>
              <button type="submit" className="btn" data-action="verify.member">
                <Search size={16} aria-hidden /> {m('goMember')}
              </button>
            </form>
          </section>
        </div>
        <p className="muted" style={{ marginTop: 10 }}>
          {m('help')}
        </p>

        {result && (
          <section className="card" aria-live="polite" style={{ marginTop: 18 }} data-verify={result.kind}>
            {v ? (
              <div className="vf-result">
                <div>
                  <div
                    className={`vf-banner ${ok ? 'ok' : 'bad'}`}
                    data-member-status={v.member_status ?? ''}
                    data-cert-status={v.certificate_status ?? ''}
                  >
                    {ok ? <BadgeCheck size={28} aria-hidden /> : <ShieldX size={28} aria-hidden />}
                    <div>
                      <b className="block text-[18px]">{ok ? m('genuine') : m(`statusTitle.${badTitle(v)}`)}</b>
                      <small>
                        {v.replaced_by
                          ? m('replacedBy', { ref: v.replaced_by })
                          : ok
                            ? m('genuineHelp')
                            : m('notCurrentHelp')}
                      </small>
                    </div>
                  </div>
                  {result.kind === 'found' && result.signature === 'valid' && (
                    <p className="vf-sig" data-signature="valid">
                      <ShieldCheck size={16} aria-hidden /> {m('signed')}
                    </p>
                  )}
                  <div className="kv" style={{ marginTop: 14 }}>
                    {(
                      [
                        [m('holder'), v.business_name],
                        [m('memberNo'), v.member_no],
                        [m('category'), v.category ? msg(locale, `verify.categories.${v.category}`) : null],
                        [m('class'), v.class ? msg(locale, `membership.classes.${v.class}`) : null],
                        [m('memberStatus'), v.member_status ? m(`memberStatuses.${v.member_status}`) : null],
                        [
                          m('period'),
                          v.member_since || v.valid_to ? `${day(v.member_since)} – ${day(v.valid_to)}` : null,
                        ],
                        [
                          m('certStatus'),
                          v.certificate_status ? m(`status.${v.certificate_status}`) : m('noCertificate'),
                        ],
                        [m('code'), v.certificate_ref],
                        [m('checkedOn'), day(v.checked_on)],
                      ] as const
                    ).map(([k, val]) => (
                      <div key={k}>
                        <small>{k}</small>
                        <b>{val || '—'}</b>
                      </div>
                    ))}
                  </div>
                </div>
                {pattern && (
                  <figure className="vf-pattern" data-fingerprint={pattern.fingerprint}>
                    <span dangerouslySetInnerHTML={{ __html: pattern.svg }} />
                    <figcaption>
                      {m('pattern')}
                      <b>{pattern.fingerprint}</b>
                    </figcaption>
                  </figure>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <CircleAlert size={24} color="#b91c1c" aria-hidden />
                <p role="alert" style={{ fontWeight: 700, color: '#b91c1c' }}>
                  {m(`result.${result.kind}`)}
                </p>
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
}
