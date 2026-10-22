'use client';
import { createBrowserClient } from '@supabase/ssr';
import { requirePublicSupabaseEnv } from './env';
import type { Database } from './types';

/** Browser client — for Realtime subscriptions only (docs/01-architecture.md). */
export function createClient() {
  const { url, anonKey } = requirePublicSupabaseEnv();
  return createBrowserClient<Database>(url, anonKey);
}
