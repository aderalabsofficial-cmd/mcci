import type { ReactNode } from 'react';
import { Bi } from '@/components/shared/bi';
import type { Locale } from '@/i18n/routing';
import type { Label } from '@/lib/nav/model';

/** Screen title (prototype .ph): 30 px on desktop; 20 px on one line (English · Urdu side by side) on phones. */
export function PageHeader({
  locale,
  title,
  bilingual,
  children,
}: {
  locale: Locale;
  title: Label;
  bilingual: boolean;
  children?: ReactNode;
}) {
  return (
    <div className="mb-3 flex flex-wrap items-center justify-between gap-3 sm:mb-5 sm:gap-4">
      <h1 className="text-[length:var(--title)] leading-tight font-bold tracking-tight">
        <Bi label={title} locale={locale} single={!bilingual} className="max-sm:bi-row max-sm:gap-x-2.5" />
      </h1>
      {children}
    </div>
  );
}
