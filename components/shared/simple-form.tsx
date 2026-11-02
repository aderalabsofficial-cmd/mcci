'use client';

import { useRouter } from 'next/navigation';
import { useRef, useState, useTransition, type ReactNode } from 'react';
import { ActionNotice } from '@/components/shared/action-notice';
import type { Locale } from '@/i18n/routing';
import { callAction, type Outcome } from '@/lib/client/call-action';

/** A form for one server action: sends its fields with the language, shows the server's answer, refreshes the page. */
export function SimpleForm({
  locale,
  action,
  className,
  resetOnDone = true,
  onDone,
  children,
}: {
  locale: Locale;
  action: (form: FormData) => Promise<Outcome>;
  className?: string;
  resetOnDone?: boolean;
  onDone?: (result: Outcome) => void;
  children: (busy: boolean) => ReactNode;
}) {
  const router = useRouter();
  const ref = useRef<HTMLFormElement>(null);
  const [note, setNote] = useState<Outcome | null>(null);
  const [pending, start] = useTransition();
  return (
    <>
      <form
        ref={ref}
        className={className}
        onSubmit={(e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          fd.set('locale', locale);
          start(async () => {
            const r = await callAction(locale, () => action(fd));
            setNote(r);
            if (r.ok) {
              if (resetOnDone) ref.current?.reset();
              onDone?.(r);
              router.refresh();
            }
          });
        }}
      >
        {children(pending)}
      </form>
      <ActionNotice locale={locale} note={note} />
    </>
  );
}

/** Pick one file, upload it to a checked route, and carry its stored path as hidden fields in the surrounding form. */
export function DocumentUpload({
  route,
  label,
  help,
  name = 'path',
  required = false,
  multiple = false,
  dataField,
  errorText,
  extra,
}: {
  route: string;
  label: string;
  help?: string;
  name?: string;
  required?: boolean;
  multiple?: boolean;
  dataField: string;
  errorText: (code: string) => string;
  extra?: Record<string, string>;
}) {
  const [files, setFiles] = useState<{ path: string; name: string }[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  return (
    <div className="form-field">
      <label>
        {label}
        <input
          type="file"
          accept="application/pdf,image/jpeg,image/png"
          data-field={dataField}
          disabled={busy}
          multiple={multiple}
          required={required && files.length === 0}
          onChange={async (e) => {
            const chosen = [...(e.target.files ?? [])];
            e.target.value = '';
            setError(null);
            setBusy(true);
            for (const file of chosen) {
              const body = new FormData();
              body.set('file', file);
              for (const [k, v] of Object.entries(extra ?? {})) body.set(k, v);
              try {
                const res = await fetch(route, { method: 'POST', body });
                const json = (await res.json()) as { path?: string; name?: string; error?: string };
                if (!res.ok || !json.path) setError(errorText(json.error ?? 'generic'));
                else setFiles((x) => [...(multiple ? x : []), { path: json.path!, name: json.name ?? file.name }]);
              } catch {
                setError(errorText('generic'));
              }
            }
            setBusy(false);
          }}
        />
      </label>
      {help && <small className="muted">{help}</small>}
      {files.map((f) => (
        <small key={f.path} className="muted" data-uploaded={f.name}>
          ✓ {f.name}
        </small>
      ))}
      {error && (
        <small role="alert" className="doc-error">
          {error}
        </small>
      )}
      {multiple ? (
        <input type="hidden" name={name} value={JSON.stringify(files)} />
      ) : (
        <>
          <input type="hidden" name={name} value={files[0]?.path ?? ''} />
          <input type="hidden" name={`${name}Name`} value={files[0]?.name ?? ''} />
        </>
      )}
    </div>
  );
}
