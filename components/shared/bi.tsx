import type { Locale } from '@/i18n/routing';
import type { Label } from '@/lib/nav/model';
import { cn } from '@/lib/utils';

/**
 * Bilingual label: English with Urdu underneath (prototype .bi). In the Urdu locale the Urdu comes first.
 * single = only the active locale (public site, admin, long lists; docs/15-mobile-app.md §5.2).
 */
export function Bi({
  label,
  locale,
  single = false,
  row = false,
  className,
}: {
  label: Label;
  locale: Locale;
  single?: boolean;
  row?: boolean;
  className?: string;
}) {
  if (single) return <span className={className}>{label[locale]}</span>;
  const enFirst = locale === 'en';
  const enEl = (
    <span key="en" lang="en" className={cn(!enFirst && 'text-[0.8em] opacity-75')}>
      {label.en}
    </span>
  );
  const urEl = (
    <span key="ur" lang="ur" className={cn('bi-ur', !enFirst && 'text-[1.05em] opacity-100')}>
      {label.ur}
    </span>
  );
  return <span className={cn('bi', row && 'bi-row', className)}>{enFirst ? [enEl, urEl] : [urEl, enEl]}</span>;
}
