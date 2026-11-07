import type { Locale } from '@/i18n/routing';
import { msg } from '@/lib/nav/model';

/** the design's "verify any MCCI document" box, opening the real public verification page (/verify?c=…) */
export function VerifyBox({ locale }: { locale: Locale }) {
  const m = (k: string) => msg(locale, `landing.${k}`);
  return (
    <form className="verify" id="verify" method="get" action={locale === 'ur' ? '/ur/verify' : '/verify'}>
      <div className="verify-txt">
        <h3>{m('verify_title')}</h3>
        <p>{m('verify_sub')}</p>
      </div>
      <div className="verify-field">
        <label className="sr" htmlFor="vcode">
          {msg(locale, 'site.verify.label')}
        </label>
        <input
          id="vcode"
          name="c"
          dir="ltr"
          placeholder={msg(locale, 'site.verify.placeholder')}
          autoComplete="off"
          spellCheck={false}
          required
        />
        <button className="btn btn-green" type="submit" data-action="verify.go">
          {m('verify_btn')}
        </button>
      </div>
    </form>
  );
}
