import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

/** Synthetic e2e accounts written by auth.setup.ts (test-results/ is git-ignored; teardown deletes the file). */
export const AUTH_DIR = join('test-results', '.auth');
export const ACCOUNTS_FILE = join(AUTH_DIR, 'accounts.json');
export const STATE = {
  member: join(AUTH_DIR, 'member.json'),
  staff: join(AUTH_DIR, 'staff.json'),
  sg: join(AUTH_DIR, 'sg.json'),
  president: join(AUTH_DIR, 'president.json'),
  convener: join(AUTH_DIR, 'convener.json'),
  itconv: join(AUTH_DIR, 'itconv.json'),
};

/** staff personas and their designations (docs/24: the hierarchy of 28 Oct 2026) */
export const STAFF = {
  staff: 'Membership Officer',
  sg: 'Secretary General',
  president: 'President (Signatory)',
  convener: 'Membership Committee Convener',
  itconv: 'IT Convener',
} as const;
export type StaffPersona = keyof typeof STAFF;
type StaffAccount = { id: string; email: string; password: string; totpSecret: string };

export interface E2eAccounts {
  backend: boolean;
  run?: string;
  member?: { id: string; email: string; password: string; memberNo: string };
  staff?: StaffAccount;
  /** Secretary General (Staff & Roles: invitations, limits) */
  sg?: StaffAccount;
  president?: StaffAccount;
  convener?: StaffAccount;
  itconv?: StaffAccount;
  /** a confirmed account whose password the reset test changes (no other test uses it) */
  reset?: { id: string; email: string; password: string };
  companyId?: string;
  memberRowId?: string;
}

export function readAccounts(): E2eAccounts {
  if (!existsSync(ACCOUNTS_FILE)) return { backend: false };
  return JSON.parse(readFileSync(ACCOUNTS_FILE, 'utf8')) as E2eAccounts;
}

export const NO_BACKEND = 'needs the local Supabase stack (MCCI_IT_LOCAL=1 with its URL and keys) to sign in';
