import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';
import { msg } from '@/lib/nav/model';

/**
 * Building blocks of the public pages (prototype site.js pageH / sec / card): the inner-page hero over the MCCI
 * photo, numbered sections, and cards. Pages wrap their content in <SitePage>.
 */

export function SitePage({ locale, children }: { locale: Locale; children: ReactNode }) {
  return (
    <div className="proto site" lang={locale}>
      {children}
    </div>
  );
}

/**
 * inner-page hero (pageH): breadcrumb, title, the title in the other language, one line underneath. Title and sub are
 * message keys; `text` gives already-translated strings instead (e.g. a service's name from the database).
 */
export function PageHero({
  locale,
  title,
  sub,
  text,
}: {
  locale: Locale;
  title: string;
  sub: string;
  text?: { title: string; other: string; sub: string };
}) {
  const other = locale === 'en' ? 'ur' : 'en';
  const t = text ?? { title: msg(locale, title), other: msg(other, title), sub: msg(locale, sub) };
  return (
    <section className="xhero sub">
      <div className="hero-bg" aria-hidden />
      <div className="hero-ov" aria-hidden />
      <div className="wr w-full">
        <nav className="xcrumb" aria-label={msg(locale, 'common.breadcrumb')}>
          <Link href="/" data-action="nav">
            {msg(locale, 'site.home')}
          </Link>
          <span aria-hidden>›</span>
          <b aria-current="page">{t.title}</b>
        </nav>
        <h1>{t.title}</h1>
        <p className="xurl" lang={other} dir={other === 'ur' ? 'rtl' : 'ltr'}>
          {t.other}
        </p>
        <p className="xsub">{t.sub}</p>
      </div>
      <div className="xwave" aria-hidden />
    </section>
  );
}

/** numbered section (sec): eyebrow number, heading, one line, content */
export function Section({
  n,
  title,
  sub,
  alt = false,
  id,
  children,
  className = '',
}: {
  n: number;
  title: ReactNode;
  sub?: ReactNode;
  alt?: boolean;
  id?: string;
  children: ReactNode;
  className?: string;
}) {
  const hid = id ? `${id}-h` : undefined;
  return (
    <section className={`sx ${alt ? 'alt' : ''} ${className}`} id={id} aria-labelledby={hid}>
      <div className="wr">
        <div className="sh xrv">
          <span className="ey" aria-hidden>
            {String(n).padStart(2, '0')}
          </span>
          <h2 id={hid}>{title}</h2>
          {sub ? <p>{sub}</p> : null}
        </div>
        {children}
      </div>
    </section>
  );
}

/** card with an icon tile; a link when href is given, a static card otherwise */
export function Card({
  icon: Icon,
  color,
  title,
  body,
  href,
  more,
  action = 'nav',
  children,
}: {
  icon: LucideIcon;
  color: string;
  title: ReactNode;
  body?: ReactNode;
  href?: string;
  more?: ReactNode;
  action?: string;
  children?: ReactNode;
}) {
  const inner = (
    <>
      <i style={{ background: `${color}22` }} aria-hidden>
        <Icon size={28} color={color} />
      </i>
      <h4>{title}</h4>
      {body ? <p>{body}</p> : null}
      {children}
      {more ? <b>{more}</b> : null}
    </>
  );
  return href ? (
    <Link className="sc" href={href} data-action={action}>
      {inner}
    </Link>
  ) : (
    <div className="sc st">{inner}</div>
  );
}

export const C = { GR: '#1fa34a', BL: '#3b82f6', OR: '#f59e0b', PU: '#8b5cf6', RD: '#ef4444', TL: '#14b8a6', PK: '#ec4899', GD: '#c8963e', CB: '#1b4f9c' };
