import type { Metadata, Viewport } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';
import { notFound } from 'next/navigation';
import { hasLocale, NextIntlClientProvider } from 'next-intl';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import type { ReactNode } from 'react';
import { dirOf, routing } from '@/i18n/routing';
import { getShell, getThemePreference } from '@/lib/shell/server';
import { cn } from '@/lib/utils';
import '../globals.css';

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-jakarta',
  display: 'swap',
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
  themeColor: '#0b2a5b',
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
      className={cn(jakarta.variable, theme === 'dark' && 'dark')}
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
