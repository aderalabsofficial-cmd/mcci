'use client';

import { useEffect } from 'react';
import type { Locale } from '@/i18n/routing';

/** after a short pause to read the message, the home page (owner, 4 Nov 2026: "then redirect on the home page") */
export function GoHomeSoon({ locale, after = 9000 }: { locale: Locale; after?: number }) {
  useEffect(() => {
    const go = setTimeout(() => window.location.assign(locale === 'ur' ? '/ur' : '/'), after);
    return () => clearTimeout(go);
  }, [locale, after]);
  return null;
}
