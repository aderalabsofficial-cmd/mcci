'use client';

import { RefreshCw } from 'lucide-react';
import type { Locale } from '@/i18n/routing';
import type { Outcome } from '@/lib/client/call-action';
import { msg } from '@/lib/nav/model';

/**
 * The answer to an action: green when the server confirmed it, red otherwise. When the call itself failed (older
 * release, connection cut), it says so and offers to reload — nothing is shown as done that the server did not confirm.
 */
export function ActionNotice({
  locale,
  note,
  className = '',
}: {
  locale: Locale;
  note: Outcome | null;
  className?: string;
}) {
  if (!note) return null;
  return (
    <div
      className={`banner ${note.ok ? 'green' : 'red'} ${className}`}
      role={note.ok ? 'status' : 'alert'}
      data-outcome={note.ok ? 'ok' : (note.failure ?? 'refused')}
      style={{ marginBottom: 12, display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}
    >
      <span style={{ flex: 1 }}>{note.message}</span>
      {note.failure && (
        <button
          type="button"
          className="btn btn-w"
          data-action="page.reload"
          // the banner's text is white; the button is white: its own text must be dark to be read
          style={{ color: '#0e1b33', background: '#fff' }}
          onClick={() => window.location.reload()}
        >
          <RefreshCw size={16} aria-hidden /> {msg(locale, 'common.reload')}
        </button>
      )}
    </div>
  );
}
