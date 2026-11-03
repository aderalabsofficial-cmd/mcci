import type { Metadata, Viewport } from 'next';
import localFont from 'next/font/local';
import { notFound } from 'next/navigation';
import { hasLocale, NextIntlClientProvider } from 'next-intl';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import type { ReactNode } from 'react';
import { dirOf, routing } from '@/i18n/routing';
import { getShell, getThemePreference } from '@/lib/shell/server';
import { cn } from '@/lib/utils';
import '../globals.css';

/*
 * Plus Jakarta Sans and Manrope from the repo (app/fonts, SIL OFL), never fetched from Google: a build that asked
 * Google failed whenever it answered with font links next/font cannot read (3 Nov 2026). The files are Google's own
 * variable-weight woff2, Latin and Latin Extended, under the fonts' real names (proto.css and landing-fx use them)
 * with Google's unicode ranges, so a browser fetches the extended file only for a letter such as ā or ł.
 * next/font takes written-out values only, so the
 * ranges repeat; tests/unit/fonts.test.ts keeps each pair the same.
 */
const jakarta = localFont({
  src: '../fonts/plus-jakarta-sans-latin.woff2',
  weight: '200 800',
  declarations: [
    { prop: 'font-family', value: "'Plus Jakarta Sans'" },
    { prop: 'unicode-range', value: 'U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD' },
  ],
  variable: '--font-jakarta',
  display: 'swap',
});
const jakartaExt = localFont({
  src: '../fonts/plus-jakarta-sans-latin-ext.woff2',
  weight: '200 800',
  declarations: [
    { prop: 'font-family', value: "'Plus Jakarta Sans'" },
    { prop: 'unicode-range', value: 'U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C4, U+2113, U+2C60-2C7F, U+A720-A7FF' },
  ],
  variable: '--font-jakarta-ext',
  display: 'swap',
  preload: false,
  adjustFontFallback: false,
});

// the owner's design: body text on the home and sign-in pages
const manrope = localFont({
  src: '../fonts/manrope-latin.woff2',
  weight: '200 800',
  declarations: [
    { prop: 'font-family', value: "'Manrope'" },
    { prop: 'unicode-range', value: 'U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD' },
  ],
  variable: '--font-manrope',
  display: 'swap',
});
const manropeExt = localFont({
  src: '../fonts/manrope-latin-ext.woff2',
  weight: '200 800',
  declarations: [
    { prop: 'font-family', value: "'Manrope'" },
    { prop: 'unicode-range', value: 'U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C4, U+2113, U+2C60-2C7F, U+A720-A7FF' },
  ],
  variable: '--font-manrope-ext',
  display: 'swap',
  preload: false,
  adjustFontFallback: false,
});

// Follows the system theme until the person picks one (theme cookie), without a flash of the wrong theme.
const THEME_SCRIPT = `(function(){try{var m=document.cookie.match(/(?:^|; )theme=(dark|light)/);var d=m?m[1]==='dark':matchMedia('(prefers-color-scheme: dark)').matches;document.documentElement.classList.toggle('dark',d)}catch(e){}})()`;

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  const t = await getTranslations({ locale, namespace: 'meta' });
  return { title: { default: t('title'), template: `%s · ${t('title')}` }, description: t('description') };
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#005c35',
};

export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const [shell, theme, t] = await Promise.all([
    getShell(),
    getThemePreference(),
    getTranslations({ locale, namespace: 'common' }),
  ]);

  return (
    <html
      lang={locale}
      dir={dirOf(locale)}
      data-shell={shell}
      className={cn(jakarta.variable, jakartaExt.variable, manrope.variable, manropeExt.variable, theme === 'dark' && 'dark')}
      suppressHydrationWarning
    >
      <head>{theme === null && <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />}</head>
      <body className="min-h-svh antialiased">
        <a
          href="#main"
          className="fixed start-3 top-3 z-[100] -translate-y-24 rounded-xl bg-card px-4 py-3 font-bold shadow-card focus:translate-y-0"
        >
          {t('skipToContent')}
        </a>
        <NextIntlClientProvider>{children}</NextIntlClientProvider>
      </body>
    </html>
  );
}
