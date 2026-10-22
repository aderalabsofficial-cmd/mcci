import { notFound } from 'next/navigation';
import { hasLocale } from 'next-intl';
import { type Locale, routing } from './routing';

/** Narrows the [locale] route param; unknown locales are a 404. */
export function asLocale(value: string): Locale {
  if (!hasLocale(routing.locales, value)) notFound();
  return value;
}
