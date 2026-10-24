import type { Locale } from '@/i18n/routing';
import { msg } from '@/lib/nav/model';
import { PermissionError } from '@/lib/permissions/server';

/**
 * What a Staff & Roles / company-user action tells the screen: one bilingual sentence, ok or not. The database
 * functions (migrations 0280, 0290) raise 42501 when the person is not allowed and P0001 with a stable hint for a
 * business rule; this maps both to messages under `access.errors`. Never shows the raw database text.
 */
export interface ActionResult {
  ok: boolean;
  message: string;
}

const HINTS = new Set([
  'email',
  'already_staff',
  'already_invited',
  'already_member',
  'designation',
  'invite_closed',
  'self',
  'not_staff',
  'not_member',
  'sg_fixed',
  'module',
  'level',
]);

export interface DbError {
  code?: string;
  hint?: string | null;
  message?: string;
}

export function dbErrorKey(error: DbError): string {
  if (error.code === '42501') return 'access.errors.notAllowed';
  if (error.code === 'P0001' && error.hint && HINTS.has(error.hint)) return `access.errors.${error.hint}`;
  // private.keep_one_owner (0130): the last active Owner cannot be demoted or removed
  if (error.code === '23514' && /active Owner/.test(error.message ?? '')) return 'access.errors.lastOwner';
  return 'access.errors.generic';
}

export const ok = (locale: Locale, path: string, vars?: Record<string, string>): ActionResult => ({
  ok: true,
  message: msg(locale, path, vars),
});

export const fail = (locale: Locale, path: string): ActionResult => ({ ok: false, message: msg(locale, path) });

export function dbFail(locale: Locale, error: DbError, what: string): ActionResult {
  const key = dbErrorKey(error);
  if (key === 'access.errors.generic') console.error(`${what} failed`, error.code, error.message);
  return fail(locale, key);
}

/** Turns a refused requirePermission() into the "not allowed" message; anything else is rethrown. */
export function permissionFail(locale: Locale, error: unknown): ActionResult {
  if (error instanceof PermissionError) return fail(locale, 'access.errors.notAllowed');
  throw error;
}
