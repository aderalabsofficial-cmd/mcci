/**
 * An account made by the sign-up of 4 Nov 2026 (lib/auth/signup-actions.ts) whose person has not finished it yet: the
 * emailed code was right, but no name, password or member answer yet. Only such accounts are sent to
 * /register/details; invited, imported and demo accounts never carry `signup_started`.
 */
export function signupUnfinished(meta: Record<string, unknown> | null | undefined): boolean {
  return meta?.signup_started === true && meta?.signup_done !== true;
}
