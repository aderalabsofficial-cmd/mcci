'use server';

import { createClient } from '@/lib/supabase/server';

/**
 * The idle guard's two calls (components/shell/idle-guard.tsx). keepAlive: the person is typing or clicking on the
 * page without loading another one — the call itself passes the middleware, which records the activity.
 * endIdle: 15 minutes without activity — this session is signed out (its refresh token revoked) before the sign-in
 * page opens, so going back does not bring the session back.
 */
export async function keepAlive(): Promise<{ ok: boolean }> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  return { ok: Boolean(data.user) };
}

export async function endIdle(): Promise<{ ok: boolean }> {
  const supabase = await createClient();
  await supabase.auth.signOut({ scope: 'local' });
  return { ok: true };
}
