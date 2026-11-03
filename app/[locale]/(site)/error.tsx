'use client';

import { useTranslations } from 'next-intl';
import { useEffect } from 'react';
import { Link } from '@/i18n/navigation';

/**
 * Last resort for a public page whose required read failed (an optional read only costs its own section, see
 * lib/site/read-or.ts): a plain bilingual message, Try again and the way home, instead of the bare server error.
 */
export default function SiteError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const t = useTranslations();
  useEffect(() => {
    console.error('site page failed', error.digest ?? '');
  }, [error]);
  return (
    <div className="proto site">
      <section className="sx" aria-labelledby="site-error-h">
        <div className="wr" style={{ textAlign: 'center', paddingTop: 'calc(var(--xh, 72px) + 24px)' }}>
          <h1 id="site-error-h" style={{ fontSize: 28, fontWeight: 800, marginBottom: 10 }}>
            {t('site.pageFailed')}
          </h1>
          <p className="read-failed" role="status" data-read-failed style={{ maxWidth: 560, margin: '0 auto 18px' }}>
            {t('landing.read_failed')}
          </p>
          <div className="pb" style={{ justifyContent: 'center' }}>
            <button type="button" className="btn btn-primary" onClick={reset} data-action="page.retry">
              {t('site.tryAgain')}
            </button>
            <Link className="btn" href="/" data-action="nav">
              {t('site.home')}
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
