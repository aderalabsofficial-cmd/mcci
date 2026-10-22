import 'server-only';
import { createClient } from '@supabase/supabase-js';
import { requirePublicSupabaseEnv } from './env';
import type { Database } from './types';

/**
 * Service-role client: bypasses row-level security.
 * Only for cron handlers, PDF generation and the public verify endpoint (fixed minimal projection).
 * Never import it in a component — ESLint blocks it outside app/api and lib/pdf.
 */
export function createAdminClient() {
  const { url } = requirePublicSupabaseEnv();
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set (server only).');
  return createClient<Database>(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
