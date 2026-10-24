import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

/** Synthetic e2e accounts written by auth.setup.ts (test-results/ is git-ignored; teardown deletes the file). */
export const AUTH_DIR = join('test-results', '.auth');
export const ACCOUNTS_FILE = join(AUTH_DIR, 'accounts.json');
export const STATE = {
  member: join(AUTH_DIR, 'member.json'),
  staff: join(AUTH_DIR, 'staff.json'),
  sg: join(AUTH_DIR, 'sg.json'),
};

export interface E2eAccounts {
  backend: boolean;
  run?: string;
  member?: { id: string; email: string; password: string; memberNo: string };
  staff?: { id: string; email: string; password: string; totpSecret: string };
  /** Secretary General (Staff & Roles: invitations, limits) */
  sg?: { id: string; email: string; password: string; totpSecret: string };
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
