'use client';

import { Save } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { type ReactNode, useState, useTransition } from 'react';
import { ActionNotice } from '@/components/shared/action-notice';
import type { Locale } from '@/i18n/routing';
import { callAction, type Outcome } from '@/lib/client/call-action';
import { msg } from '@/lib/nav/model';
import { saveSettings } from '@/lib/settings/actions';

/** one field of a settings card; `path` is where it sits in the stored value (e.g. "Corporate.admission") */
export interface SettingField {
  path: string;
  label: string;
  kind: 'text' | 'email' | 'int' | 'money' | 'bool' | 'decimal';
  value: string | number | boolean;
  min?: number;
  max?: number;
  step?: number;
  hint?: string;
  wide?: boolean;
}

function setPath(o: Record<string, unknown>, path: string, v: unknown) {
  const ks = path.split('.');
  let d = o;
  for (const k of ks.slice(0, -1)) d = (d[k] ??= {}) as Record<string, unknown>;
  d[ks.at(-1)!] = v;
}

/**
 * settings.save: a card of Platform Settings (admin/settings). The fields are sent together, with an optional reason
 * for the audit log; the database checks every value (api.settings_save). Read-only for Platform 1.
 */
export function SettingsCard({
  locale,
  settingKey,
  title,
  intro,
  fields,
  canEdit,
  children,
}: {
  locale: Locale;
  settingKey: string;
  title: string;
  intro?: string;
  fields: SettingField[];
  canEdit: boolean;
  children?: ReactNode;
}) {
  const t = (k: string) => msg(locale, `settings.${k}`);
  const router = useRouter();
  const [refreshing, start] = useTransition();
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<Outcome | null>(null);
  return (
    <section className="card" aria-labelledby={`st-${settingKey}`} data-settings={settingKey}>
      <div className="ch">
        <h3 id={`st-${settingKey}`}>{title}</h3>
      </div>
      {intro && (
        <p className="muted" style={{ marginBottom: 12 }}>
          {intro}
        </p>
      )}
      <form
        className="grid gap-3"
        onSubmit={async (e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          const value: Record<string, unknown> = {};
          for (const f of fields) {
            if (f.kind === 'bool') setPath(value, f.path, fd.get(f.path) === 'on');
            else if (f.kind === 'int' || f.kind === 'money' || f.kind === 'decimal')
              setPath(value, f.path, Number(fd.get(f.path)));
            else setPath(value, f.path, String(fd.get(f.path) ?? ''));
          }
          setBusy(true);
          setNote(null);
          const r = await callAction(locale, () =>
            saveSettings(locale, settingKey, value, String(fd.get('reason') ?? '') || undefined),
          );
          setBusy(false);
          setNote(r);
          if (r.ok) start(() => router.refresh());
        }}
      >
        <fieldset
          disabled={!canEdit || busy || refreshing}
          className="st-grid"
          title={canEdit ? undefined : t('readOnly')}
        >
          {fields.map((f) =>
            f.kind === 'bool' ? (
              <label key={f.path} className="st-bool">
                <input type="checkbox" name={f.path} defaultChecked={Boolean(f.value)} />
                <span>
                  {f.label}
                  {f.hint && <small className="muted block">{f.hint}</small>}
                </span>
              </label>
            ) : (
              <label key={f.path} className={`form-field ${f.wide ? 'st-wide' : ''}`}>
                {f.label}
                <input
                  name={f.path}
                  type={f.kind === 'text' ? 'text' : f.kind === 'email' ? 'email' : 'number'}
                  defaultValue={String(f.value ?? '')}
                  required={f.kind !== 'text' || f.path === 'name' || f.path === 'addr'}
                  min={f.min}
                  max={f.max}
                  step={f.step ?? (f.kind === 'decimal' ? 0.001 : 1)}
                  inputMode={
                    f.kind === 'text' || f.kind === 'email' ? undefined : f.kind === 'decimal' ? 'decimal' : 'numeric'
                  }
                />
                {f.hint && <small className="muted">{f.hint}</small>}
              </label>
            ),
          )}
          {children}
          {canEdit && (
            <label className="form-field st-wide">
              {t('reason')}
              <input name="reason" maxLength={300} placeholder={t('reasonHint')} />
            </label>
          )}
        </fieldset>
        <ActionNotice locale={locale} note={note} />
        {canEdit && (
          <div className="flex justify-end">
            <button type="submit" className="btn btn-primary" data-action="settings.save" disabled={busy || refreshing}>
              <Save size={16} aria-hidden /> {busy ? t('saving') : t('save')}
            </button>
          </div>
        )}
      </form>
    </section>
  );
}
