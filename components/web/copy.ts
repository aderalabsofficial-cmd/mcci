import type { Locale } from '@/i18n/routing';
import { msg } from '@/lib/nav/model';

const ROUTES: Record<string, string> = {
  index: '/',
  about: '/about',
  services: '/services',
  membership: '/membership',
  news: '/news',
  leadership: '/leadership',
  contact: '/contact',
  login: '/login',
  launch: '/launch',
};

/**
 * The design's words for one language (messages landing.*). `html` is for the few strings that carry their own
 * markup (bold, a line break, a link): MCCI's own text from messages/*.json, never anything a visitor typed. Links in
 * it are written as the design's page names (membership.html#fees) and become this site's routes in this language.
 */
export function webCopy(locale: Locale) {
  const prefix = locale === 'ur' ? '/ur' : '';
  const m = (key: string) => msg(locale, `landing.${key}`);
  const html = (key: string) =>
    m(key).replace(/href="([\w-]+)\.html(#[^"]*)?"/g, (all, page: string, hash = '') =>
      page in ROUTES ? `href="${prefix}${ROUTES[page] === '/' && prefix ? '' : ROUTES[page]}${hash}"` : all,
    );
  return { m, html };
}
