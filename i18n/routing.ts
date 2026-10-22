import { defineRouting } from 'next-intl/routing';

export const locales = ['en', 'ur'] as const;
export type Locale = (typeof locales)[number];

export const routing = defineRouting({
  locales,
  defaultLocale: 'en',
  // English at /portal, Urdu at /ur/portal
  localePrefix: 'as-needed',
  localeCookie: { name: 'NEXT_LOCALE', maxAge: 60 * 60 * 24 * 365 },
});

export const dirOf = (locale: string): 'ltr' | 'rtl' => (locale === 'ur' ? 'rtl' : 'ltr');
