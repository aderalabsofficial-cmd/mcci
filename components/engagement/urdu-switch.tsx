'use client';

import { useState } from 'react';
import { ActionForm, Hidden } from '@/components/shared/action-form';
import { FormMessage } from '@/components/shared/modal';
import type { Locale } from '@/i18n/routing';
import type { ActionResult } from '@/lib/access/result';
import { setUrduFirst } from '@/lib/company/actions';
import { msg } from '@/lib/nav/model';
import { cn } from '@/lib/utils';

/** setting.toggle me.prefs.urdu on the Messages page (the same preference as on Company Profile) */
export function UrduSwitch({ locale, urduFirst }: { locale: Locale; urduFirst: boolean }) {
  const [notice, setNotice] = useState<ActionResult | null>(null);
  const label = msg(locale, 'eng.notes.urdu');
  return (
    <>
      <ActionForm action={setUrduFirst} onDone={setNotice} className="flex items-center justify-between gap-3">
        {(busy) => (
          <>
            <Hidden values={{ locale, ...(urduFirst ? {} : { urdu: 'on' }) }} />
            <span>
              <b className="block">{label}</b>
              <small className="text-muted">{msg(locale, 'eng.notes.urduSub')}</small>
            </span>
            <button
              role="switch"
              aria-checked={urduFirst}
              aria-label={label}
              className="flex h-11 w-12 shrink-0 items-center"
              data-action="setting.toggle"
              disabled={busy}
            >
              <span
                className={cn(
                  'relative block h-7 w-12 rounded-full border border-line transition-colors',
                  urduFirst ? 'bg-ok' : 'bg-card2',
                )}
              >
                <span
                  className={cn(
                    'absolute top-0.5 size-[22px] rounded-full bg-white shadow transition-[inset-inline-start]',
                    urduFirst ? 'start-[22px]' : 'start-0.5',
                  )}
                />
              </span>
            </button>
          </>
        )}
      </ActionForm>
      {notice && <FormMessage result={notice} />}
    </>
  );
}
