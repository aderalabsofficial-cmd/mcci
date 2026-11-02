'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useTransition } from 'react';
import { usePathname, useRouter } from '@/i18n/navigation';
import { cn } from '@/lib/utils';

/**
 * English / اردو switch (action lang.toggle). Changes the locale and the NEXT_LOCALE cookie.
 * TODO(M1): also save it to the signed-in user's preferences (PATCH /api/me/preferences) so emails follow it.
 */
export function LangToggle({ variant = 'bar', className }: { variant?: 'bar' | 'glass' | 'slide'; className?: string }) {
  const t = useTranslations('common');
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();
  const next = locale === 'en' ? 'ur' : 'en';

  if (variant === 'slide') {
    // the owner's design: both languages with a green thumb sliding behind the current one
    return (
      <button
        type="button"
        data-action="lang.toggle"
        className={cn('lang', className)}
        aria-label={t('switchLanguage')}
        aria-busy={pending || undefined}
        onClick={() => startTransition(() => router.replace(pathname, { locale: next }))}
      >
        <span className="lang-opt lang-en" lang="en">
          {t('langEn')}
        </span>
        <span className="lang-opt lang-ur" lang="ur">
          {t('langUr')}
        </span>
        <span className="lang-thumb" aria-hidden />
      </button>
    );
  }

  return (
    <button
      type="button"
      data-action="lang.toggle"
      aria-label={t('switchLanguage')}
      aria-busy={pending || undefined}
      onClick={() => startTransition(() => router.replace(pathname, { locale: next }))}
      className={cn(
        'inline-flex h-11 min-w-11 items-center justify-center rounded-xl px-3 font-bold whitespace-nowrap transition-colors',
        variant === 'bar' && 'border border-line hover:bg-hover',
        variant === 'glass' && 'border border-white/35 bg-white/8 text-white hover:bg-white/18',
        className,
      )}
    >
      {variant === 'glass' ? (
        // public header (prototype .xlang): "EN | اردو", the active language in full strength
        <span dir="ltr" className="inline-flex items-center gap-1.5">
          <span lang="en" className={cn(locale !== 'en' && 'opacity-80')}>
            {t('langEn')}
          </span>
          <span aria-hidden className="opacity-50">
            |
          </span>
          <span
            lang="ur"
            className={cn('font-urdu text-[17px] leading-none font-normal', locale !== 'ur' && 'opacity-80')}
          >
            {t('langUr')}
          </span>
        </span>
      ) : (
        <span lang={next} className={next === 'ur' ? 'font-urdu text-[17px] leading-none' : undefined}>
          {t('otherLanguage')}
        </span>
      )}
    </button>
  );
}
