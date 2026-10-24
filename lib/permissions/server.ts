import 'server-only';
import { cache } from 'react';
import { publicSupabaseEnv } from '@/lib/supabase/env';
import { createClient } from '@/lib/supabase/server';
import {
  accessSchema,
  companyDenial,
  staffDenial,
  type Access,
  type CompanyArea,
  type Denial,
  type Level,
  type LevelName,
  type StaffModule,
} from './levels';

/** Thrown by require* helpers; server actions turn it into a bilingual message, pages into a redirect. */
export class PermissionError extends Error {
  constructor(readonly denial: Denial) {
    super(`not allowed: ${denial}`);
    this.name = 'PermissionError';
  }
}

export interface Session {
  userId: string;
  aal: 'aal1' | 'aal2' | null;
  access: Access;
}

/**
 * The verified session of this request, or null. `getUser()` asks Auth to validate the token (never trust the cookie
 * alone); the assurance level comes from the same session; access comes from api.my_access(). Cached per request.
 */
export const getSession = cache(async (): Promise<Session | null> => {
  // No Supabase configured (CI without a backend): nobody is signed in, so protected areas redirect to /login.
  if (!publicSupabaseEnv()) return null;
  const supabase = await createClient();
  const { data: userData, error } = await supabase.auth.getUser();
  if (error || !userData.user) return null;
  const { data: aalData } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  const { data, error: rpcError } = await supabase.schema('api').rpc('my_access');
  if (rpcError) throw new Error(`api.my_access failed: ${rpcError.message}`);
  const access = accessSchema.parse(data);
  if (access.user_id !== userData.user.id) throw new Error('api.my_access returned another user');
  return { userId: userData.user.id, aal: (aalData?.currentLevel ?? null) as Session['aal'], access };
});

export async function requireUser(): Promise<Session> {
  const session = await getSession();
  if (!session) throw new PermissionError('not-signed-in');
  return session;
}

/** CLAUDE.md §6: every staff server action starts with `const actor = await requirePermission(module, level)`. */
export async function requirePermission(module: StaffModule, level: Level | LevelName): Promise<Session> {
  const session = await getSession();
  const denial = staffDenial(session?.access ?? null, session?.aal ?? null, module, level);
  if (denial) throw new PermissionError(denial);
  return session!;
}

/** Member-company counterpart: the user must belong to the company with at least `level` in `area`. */
export async function requireCompanyPermission(
  companyId: string,
  area: CompanyArea,
  level: Level | LevelName,
): Promise<Session> {
  const session = await getSession();
  const denial = companyDenial(session?.access ?? null, companyId, area, level);
  if (denial) throw new PermissionError(denial);
  return session!;
}
