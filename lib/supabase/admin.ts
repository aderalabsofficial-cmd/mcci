import 'server-only';
import { createClient } from '@supabase/supabase-js';
import { requireSecretKey, serverSupabaseUrl } from './server-env';
import type { Database } from './types';

/**
 * Secret-key client: bypasses row-level security. Only for trusted server code that the user cannot reach with
 * their own rights: cron handlers, PDF generation, the public verify endpoint (fixed minimal projection) and the
 * Auth admin calls of invitations / 2-step reset (lib/auth/admin.ts), each after a server-side permission check.
 * Never import it in a component — ESLint blocks it outside the allowed paths (eslint.config.mjs).
 */
export function createAdminClient() {
  return createClient<Database>(serverSupabaseUrl(), requireSecretKey(), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
