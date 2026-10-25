'use client';

import { useActionState, useEffect, useRef, type ReactNode } from 'react';
import { asLocale } from '@/i18n/locale';
import type { ActionResult } from '@/lib/access/result';
import { classifyActionError, failureMessage } from '@/lib/client/call-action';

export type ServerAction = (state: ActionResult | null, form: FormData) => Promise<ActionResult>;

/**
 * One form = one server action with its own pending state (works without JavaScript too). Each new result is
 * reported once to `onDone`, which the screen uses for its status line and to close dialogs.
 */
export function ActionForm({
  action,
  onDone,
  children,
  className,
}: {
  action: ServerAction;
  onDone: (r: ActionResult) => void;
  children: (pending: boolean) => ReactNode;
  className?: string;
}) {
  // a call that fails outright (older release, connection cut) is reported as such — never silent
  const [result, run, pending] = useActionState<ActionResult | null, FormData>(async (state, form) => {
    try {
      return await action(state, form);
    } catch (error) {
      return { ok: false, message: failureMessage(asLocale(String(form.get('locale') ?? 'en')), classifyActionError(error)) };
    }
  }, null);
  // callers pass inline callbacks: keep the latest one without making it an effect dependency
  const report = useRef(onDone);
  useEffect(() => {
    report.current = onDone;
  });
  useEffect(() => {
    if (result) report.current(result);
  }, [result]);
  return (
    <form action={run} className={className}>
      {children(pending)}
    </form>
  );
}

export function Hidden({ values }: { values: Record<string, string> }) {
  return (
    <>
      {Object.entries(values).map(([k, v]) => (
        <input key={k} type="hidden" name={k} value={v} />
      ))}
    </>
  );
}
