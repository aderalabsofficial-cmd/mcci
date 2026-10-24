'use client';
import { createBrowserClient } from '@supabase/ssr';
import { requirePublicSupabaseEnv } from './env';
import type { ClientDatabase } from './client-types';

/**
 * Browser client — for Realtime subscriptions only (docs/01-architecture.md). Typed with `ClientDatabase`: it runs
 * with the user's privileges, so columns clients cannot read (e.g. `endorsements.ip`) are not in its types.
 */
export function createClient() {
  const { url, publishableKey } = requirePublicSupabaseEnv();
  return createBrowserClient<ClientDatabase>(url, publishableKey);
}
