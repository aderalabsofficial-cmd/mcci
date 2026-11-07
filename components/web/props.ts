import type { ReactNode } from 'react';
import { webCopy } from '@/components/web/copy';
import { textFx } from '@/components/web/words';
import type { Locale } from '@/i18n/routing';

/** what every generated design component takes: the words in this language, the real slots, the text effects */
export function webProps(locale: Locale, slots: Record<string, ReactNode> = {}) {
  const { m, html } = webCopy(locale);
  return { m, html, slots, ...textFx(locale === 'ur') };
}
