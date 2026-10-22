import type { ReactNode } from 'react';
import { Bi } from '@/components/shared/bi';
import { NavIcon } from '@/components/shared/nav-icon';
import type { Locale } from '@/i18n/routing';
import type { Label } from '@/lib/nav/model';
import type { IconName } from '@/lib/nav/registry';
import { cn } from '@/lib/utils';

const TONES = {
  gold: 'from-[#7a5410] to-[#c8963e]',
  blue: 'from-navy-800 to-navy-600',
  red: 'from-[#7f1d1d] to-[#dc2626]',
  teal: 'from-[#0b4f4a] to-teal-500',
  green: 'from-[#0f5132] to-ok',
} as const;

/**
 * "What to do now" card shown on every member page (prototype .next): one next step, English + Urdu,
 * at most one action. At ≤ 640 px it stays under 120 px (docs/15-mobile-app.md §5.2).
 */
export function WhatNowCard({
  locale,
  heading,
  title,
  body,
  icon,
  tone = 'gold',
  action,
}: {
  locale: Locale;
  heading: Label;
  title: Label;
  body: string;
  icon: IconName;
  tone?: keyof typeof TONES;
  action?: ReactNode;
}) {
  return (
    <section
      aria-labelledby="what-now-title"
      className={cn(
        'relative mb-3 flex items-start gap-3 overflow-hidden rounded-[var(--card-radius)] bg-linear-120 p-[var(--card-pad)] text-white sm:mb-[18px] sm:flex-wrap sm:items-center sm:gap-5 sm:rounded-[22px] sm:px-[26px] sm:py-6',
        TONES[tone],
      )}
    >
      <div className="grid size-10 shrink-0 place-items-center rounded-[12px] bg-white/18 sm:size-[70px] sm:rounded-[20px]">
        <NavIcon name={icon} className="size-5 sm:size-8" />
      </div>
      <div className="min-w-0 flex-1 sm:min-w-[240px]">
        <small className="block text-[12px] leading-tight font-bold tracking-[.04em] opacity-85">
          <Bi label={heading} locale={locale} row />
        </small>
        <h2 id="what-now-title" className="mt-1 text-[16px] leading-snug font-bold sm:my-0.5 sm:text-[24px]">
          {title[locale]}
        </h2>
        <p lang={locale === 'en' ? 'ur' : 'en'} className="text-[15px] text-white/90 max-sm:hidden sm:text-[20px]">
          {locale === 'en' ? title.ur : title.en}
        </p>
        <p className="mt-0.5 text-[13.5px] leading-snug opacity-95 sm:mt-0 sm:text-[15px] sm:leading-normal">{body}</p>
        {action && <div className="mt-3">{action}</div>}
      </div>
    </section>
  );
}
