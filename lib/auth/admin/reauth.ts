import 'server-only';
import { createClient as createSupabase } from '@supabase/supabase-js';
import { requirePublicSupabaseEnv } from '@/lib/supabase/env';
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * Password confirmation before a sensitive change (migration 0400: designation limits). Supabase Auth checks the
 * password with a throw-away sign-in (its session is signed out at once and never reaches the browser); on success the
 * server records the confirmation (api.reauth_mark), which the database function then requires and uses up within 5
 * minutes. At most 5 attempts per person per 15 minutes; the visitor's address goes to Auth for its own limits.
 */
export type Reauth = 'ok' | 'wrong' | 'limited';

export async function confirmPassword(userId: string, password: string, authHeaders: Record<string, string>): Promise<Reauth> {
  const admin = createAdminClient();
  const { data: allowed } = await admin
    .schema('api')
    .rpc('rate_limit_take', { p_bucket: `reauth:${userId}`, p_limit: 5, p_window_seconds: 900 });
  if (allowed === false) return 'limited';
  const { data: user } = await admin.auth.admin.getUserById(userId);
  const email = user?.user?.email;
  if (!email || !password) return 'wrong';
  const env = requirePublicSupabaseEnv();
  const temp = createSupabase(process.env.SUPABASE_INTERNAL_URL || env.url, env.publishableKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: { headers: authHeaders },
  });
  const { data, error } = await temp.auth.signInWithPassword({ email, password });
  if (error || data.user?.id !== userId) return 'wrong';
  // the check only: this sign-in's session is ended at once
  await temp.auth.signOut({ scope: 'local' });
  const { error: markError } = await admin.schema('api').rpc('reauth_mark', { p_user: userId });
  if (markError) throw new Error(`reauth_mark: ${markError.message}`);
  return 'ok';
}
