import { BadgeCheck, CircleAlert, QrCode, ShieldX } from 'lucide-react';
import type { Locale } from '@/i18n/routing';
import { voucherDate } from '@/lib/committee/voucher';
import { msg } from '@/lib/nav/model';
import type { VerifyResult } from '@/lib/verify/admin';

const TONE: Record<string, { bg: string; fg: string }> = {
  Valid: { bg: '#e7f6ec', fg: '#0f5b3c' },
  Temporary: { bg: '#e2f5f3', fg: '#0b4f4a' },
  Superseded: { bg: '#fdf1dd', fg: '#7a4b00' },
  Expired: { bg: '#fdecec', fg: '#991b1b' },
  Revoked: { bg: '#fdecec', fg: '#991b1b' },
};

/** Verify a document (prototype site/verify): code box and the public result (action verify.go). */
export function VerifyView({ locale, code, result }: { locale: Locale; code: string; result: VerifyResult | null }) {
  const m = (k: string, v?: Record<string, string>) => msg(locale, `verify.${k}`, v);
  const other = locale === 'en' ? 'ur' : 'en';
  const day = (d: string | null) => (d ? voucherDate(`${d}T12:00:00+05:00`, locale) : '—');
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
        <section className="card" aria-labelledby="vchk">
          <div className="ch">
            <h3 id="vchk">{m('check')}</h3>
          </div>
          <form method="get" action={locale === 'ur' ? '/ur/verify' : '/verify'} className="flex flex-wrap items-end gap-3">
            <label className="form-field min-w-[240px] flex-1">
              {m('codeLabel')}
              <input name="c" defaultValue={code} placeholder="MCCI-QR-ABCDE-23456" autoComplete="off" spellCheck={false} required />
            </label>
            <button type="submit" className="btn btn-primary" data-action="verify.go">
              <QrCode size={16} aria-hidden /> {m('go')}
            </button>
          </form>
          <p className="muted" style={{ marginTop: 10 }}>
            {m('help')}
          </p>
        </section>

        {result && (
          <section className="card" aria-live="polite" style={{ marginTop: 18 }} data-verify={result.kind}>
            {result.kind === 'found' ? (
              <>
                <div
                  className="flex items-center gap-3 rounded-[12px] p-4"
                  style={{ background: TONE[result.doc.status]?.bg, color: TONE[result.doc.status]?.fg }}
                >
                  {result.doc.status === 'Valid' || result.doc.status === 'Temporary' ? (
                    <BadgeCheck size={28} aria-hidden />
                  ) : (
                    <ShieldX size={28} aria-hidden />
                  )}
                  <div>
                    <b className="block text-[18px]">{m(`status.${result.doc.status}`)}</b>
                    <small>{m(`statusHelp.${result.doc.status}`, { serial: result.doc.superseded_by ?? '' })}</small>
                  </div>
                </div>
                <div className="kv" style={{ marginTop: 14 }}>
                  {(
                    [
                      [m('doc'), result.doc.title],
                      [m('holder'), result.doc.company],
                      [m('memberNo'), result.doc.member_no],
                      [m('validTo'), day(result.doc.valid_to)],
                      [m('issued'), day(result.doc.issued)],
                      [m('code'), result.doc.code],
                    ] as const
                  ).map(([k, v]) => (
                    <div key={k}>
                      <small>{k}</small>
                      <b>{v || '—'}</b>
                    </div>
                  ))}
                </div>
              </>
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
