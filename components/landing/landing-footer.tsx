import { Logo } from '@/components/landing/logo';
import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';
import { msg } from '@/lib/nav/model';

/** The design's footer on real routes. Not shown inside the Android app, where the bottom tabs replace it. */
export function LandingFooter({ locale }: { locale: Locale }) {
  const m = (k: string, v?: Record<string, string>) => msg(locale, `landing.${k}`, v);
  return (
    <div className="lp">
      <footer className="ftr" id="footer">
        <div className="wrap">
          <div className="ftr-top">
            <div className="ftr-brand">
              <span className="ftr-logo">
                <Logo />
              </span>
              <p>
                <b>{m('ftr_name')}</b>
                <span>{m('claim_short')}</span>
              </p>
            </div>
            <div className="ftr-cols">
              <div>
                <h4>{m('ft_chamber')}</h4>
                <Link href="/about">{m('nav_about')}</Link>
                <Link href="/contact">{m('nav_contact')}</Link>
                <Link href="/news">{m('nav_news')}</Link>
              </div>
              <div>
                <h4>{m('ft_members')}</h4>
                <Link href="/membership">{m('nav_join')}</Link>
                <Link href="/services">{m('nav_services')}</Link>
                <Link href="/verify">{m('verify_short')}</Link>
              </div>
              <div>
                <h4>{m('menu_hours')}</h4>
                <p>{m('hours_wk')}</p>
                <p>{m('hours_sat')}</p>
                <p>{m('hours_sun')}</p>
              </div>
            </div>
          </div>
          <p className="ftr-word" aria-hidden>
            <span>MULTAN</span>
            <span lang="ur">ملتان</span>
          </p>
          <div className="ftr-legal">
            <span>{m('legal', { year: String(new Date().getFullYear()) })}</span>
            <span className="credit" dir="ltr">
              {m('credit')}{' '}
              <a href="https://www.aderalabs.com" target="_blank" rel="noopener noreferrer">
                Adera Labs
              </a>
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
