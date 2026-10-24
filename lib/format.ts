import type { Locale } from '@/i18n/routing';

/** CLAUDE.md §6: dates are stored as timestamptz and shown in Asia/Karachi. */
const TZ = 'Asia/Karachi';
const tag = (locale: Locale) => (locale === 'ur' ? 'ur-PK' : 'en-GB');

export function formatDate(locale: Locale, iso: string | null | undefined): string {
  if (!iso) return '—';
  return new Intl.DateTimeFormat(tag(locale), { timeZone: TZ, day: 'numeric', month: 'short', year: 'numeric' }).format(
    new Date(iso),
  );
}

/** "3 hours ago" / "2 days ago" (prototype M.ago), in the person's language. */
export function formatAgo(locale: Locale, iso: string | null | undefined, now = Date.now()): string {
  if (!iso) return '—';
  const seconds = Math.round((Date.parse(iso) - now) / 1000);
  const rtf = new Intl.RelativeTimeFormat(tag(locale), { numeric: 'auto' });
  const steps: [Intl.RelativeTimeFormatUnit, number][] = [
    ['day', 86_400],
    ['hour', 3_600],
    ['minute', 60],
  ];
  for (const [unit, size] of steps) if (Math.abs(seconds) >= size) return rtf.format(Math.round(seconds / size), unit);
  return rtf.format(0, 'minute');
}

export function formatDateTime(locale: Locale, iso: string | null | undefined): string {
  if (!iso) return '—';
  return new Intl.DateTimeFormat(tag(locale), {
    timeZone: TZ,
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso));
}
