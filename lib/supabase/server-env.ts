import 'server-only';
import { requirePublicSupabaseEnv } from './env';

/**
 * Where the Next.js SERVER reaches Supabase. Behind the TLS proxy the browser uses the public URL, while the server
 * can call the loopback gateway directly (SUPABASE_INTERNAL_URL, e.g. http://127.0.0.1:18000). Defaults to the
 * public URL (local development).
 */
export function serverSupabaseUrl(): string {
  return process.env.SUPABASE_INTERNAL_URL || requirePublicSupabaseEnv().url;
}

/** The secret key (`sb_secret_…`): bypasses row-level security. Server only; see lib/supabase/admin.ts. */
export function requireSecretKey(): string {
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!key) throw new Error('SUPABASE_SECRET_KEY is not set (server only).');
  return key;
}
