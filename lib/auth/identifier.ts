/**
 * The member login field accepts "Mobile, email or member ID" (prototype site/login). Password sign-in resolves the
 * mobile number or member ID to the account's email on the server (lib/auth/admin/resolve-login.ts); the browser is
 * never told which email that is. Sign-in with an emailed code takes an email address only, so a member ID can never
 * be used to reveal an owner's address.
 */
export type Identifier =
  | { kind: 'email'; value: string }
  | { kind: 'member'; value: string }
  | { kind: 'mobile'; value: string }
  | { kind: 'invalid' };

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// membership numbers: MCCI-C-1134 (Corporate) / MCCI-A-2205 (Associate), CLAUDE.md §6
const MEMBER_NO = /^MCCI-[CA]-\d{1,6}$/i;

/** Pakistani mobile numbers in any common form → 03XXXXXXXXX; null if it is not one. */
export function normalizeMobile(raw: string): string | null {
  const digits = raw.replace(/[\s\-().]/g, '');
  let local: string;
  if (/^\+923\d{9}$/.test(digits)) local = '0' + digits.slice(3);
  else if (/^00923\d{9}$/.test(digits)) local = '0' + digits.slice(4);
  else if (/^923\d{9}$/.test(digits)) local = '0' + digits.slice(2);
  else if (/^03\d{9}$/.test(digits)) local = digits;
  else return null;
  return local;
}

export function classifyIdentifier(raw: string): Identifier {
  const value = raw.trim();
  if (!value || value.length > 254) return { kind: 'invalid' };
  if (EMAIL.test(value)) return { kind: 'email', value: value.toLowerCase() };
  if (MEMBER_NO.test(value)) return { kind: 'member', value: value.toUpperCase() };
  const mobile = normalizeMobile(value);
  if (mobile) return { kind: 'mobile', value: mobile };
  return { kind: 'invalid' };
}

/** A same-site path to return to after sign-in; anything else (absolute URLs, //host, backslashes) is dropped. */
export function safeNext(next: string | null | undefined, fallback: string): string {
  if (!next || !next.startsWith('/') || next.startsWith('//') || next.includes('\\') || next.length > 300)
    return fallback;
  return next;
}
