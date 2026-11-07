import { LangToggle } from '@/components/shared/lang-toggle';
import { webCopy } from '@/components/web/copy';
import { Footer, Header, Menu } from '@/components/web/gen/chrome.gen';
import { WebTicker } from '@/components/web/web-ticker';
import { textFx } from '@/components/web/words';
import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';
import { getSession } from '@/lib/permissions/server';

/**
 * The owner's website chrome on every public page (6 Nov 2026): the real news bar, the design's header with the
 * route-based language switch and a sign-in button that knows who is signed in, the phone menu, and the footer.
 * Markup: components/web/gen/chrome.gen.tsx (generated from the design); interactions: WebFx.
 */
export async function webChrome(locale: Locale) {
  const copy = webCopy(locale);
  const year = String(new Date().getFullYear());
  const m = (k: string) => copy.m(k).replace('{year}', year);
  const session = await getSession();
  const where = session?.access.staff
    ? { href: '/admin', label: m('admin_panel') }
    : session
      ? { href: '/portal', label: m('my_portal') }
      : { href: '/login', label: m('login') };
  const login = (cls: string, action: string) => (
    <Link className={cls} href={where.href} data-action={action} data-signed-in={session ? 'true' : undefined}>
      {where.label}
    </Link>
  );
  const slots = {
    ticker: null,
    lang: <LangToggle variant="slide" />,
    login: login('btn btn-green hdr-login', 'nav.login'),
    menuLogin: login('btn btn-green', 'nav.login'),
  };
  const props = { m, html: copy.html, slots, ...textFx(locale === 'ur') };
  return {
    ticker: <WebTicker locale={locale} />,
    header: (
      <>
        <Header {...props} />
        <Menu {...props} />
      </>
    ),
    footer: <Footer {...props} />,
  };
}
