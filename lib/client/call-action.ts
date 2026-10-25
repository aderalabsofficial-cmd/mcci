import { unstable_isUnrecognizedActionError, unstable_rethrow } from 'next/navigation';
import type { Locale } from '@/i18n/routing';
import { msg } from '@/lib/nav/model';

/**
 * Every server action called from the browser goes through here, so a failed call is never silent and never looks
 * like success (incidents 25 Oct 2026: an application form open across a release dropped its edits; review actions
 * under load showed nothing).
 *
 * - `stale`: the page is from an older (or newer) release — Next.js no longer knows the action id. Nothing was saved
 *   by this call; the page must be reloaded.
 * - `unconfirmed`: the request failed or was cut off (network, connection, server restart). The server may or may not
 *   have saved it; the person must look again after reloading.
 * Results from the server ({ ok, message }) are passed through unchanged: only the server says "done".
 */
export type ActionFailure = 'stale' | 'unconfirmed';

export interface Outcome {
  ok: boolean;
  message: string;
  failure?: ActionFailure;
}

/** Next.js's own control-flow errors (redirect, notFound) are re-thrown, never treated as a failure */
export function classifyActionError(error: unknown): ActionFailure {
  unstable_rethrow(error);
  return unstable_isUnrecognizedActionError(error) ? 'stale' : 'unconfirmed';
}

export function failureMessage(locale: Locale, failure: ActionFailure): string {
  return msg(locale, failure === 'stale' ? 'common.actionStale' : 'common.actionUnconfirmed');
}

/** runs a server action that answers { ok, message }; a thrown call becomes an explicit failure with a reload hint */
/** an action that has not answered by then is reported as not confirmed (its request can be cut off and never settle) */
export const ACTION_TIMEOUT_MS = 45_000;

class ActionTimeout extends Error {}

export async function callAction<R extends { ok: boolean; message?: string }>(
  locale: Locale,
  fn: () => Promise<R>,
  timeoutMs = ACTION_TIMEOUT_MS,
): Promise<R | Outcome> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      fn(),
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new ActionTimeout('no answer')), timeoutMs);
      }),
    ]);
  } catch (error) {
    const failure = classifyActionError(error);
    return { ok: false, message: failureMessage(locale, failure), failure };
  } finally {
    if (timer) clearTimeout(timer);
  }
}

/** for useActionState forms whose state carries an `error` string (sign-in, 2-step, invitations) */
export function guardForm<S extends { error?: string }>(
  locale: Locale,
  fn: (state: S, form: FormData) => Promise<S>,
): (state: S, form: FormData) => Promise<S> {
  return async (state, form) => {
    try {
      return await fn(state, form);
    } catch (error) {
      return { ...state, error: failureMessage(locale, classifyActionError(error)) };
    }
  };
}

export const needsReload = (r: { failure?: ActionFailure }) => r.failure !== undefined;
